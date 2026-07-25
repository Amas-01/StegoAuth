import cv2
import numpy as np

from app.utils.image_utils import load_rgb_from_bytes, encode_to_png_bytes


# Standard JPEG luminance quantization table (JPEG specification Annex K)
JPEG_LUM_QT = np.array([
    [16, 11, 10, 16,  24,  40,  51,  61],
    [12, 12, 14, 19,  26,  58,  60,  55],
    [14, 13, 16, 24,  40,  57,  69,  56],
    [14, 17, 22, 29,  51,  87,  80,  62],
    [18, 22, 37, 56,  68, 109, 103,  77],
    [24, 35, 55, 64,  81, 104, 113,  92],
    [49, 64, 78, 87, 103, 121, 120, 101],
    [72, 92, 95, 98, 112, 100, 103,  99]
], dtype=np.float32)

# Three embedding coefficients with diverse Q factors for robustness
# across different JPEG quality scalings.
EMBED_POSITIONS = [
    (1, 0, 12.0),   # Q=12
    (0, 2, 10.0),   # Q=10
    (0, 1, 11.0),   # Q=11
]


def string_to_bits(text: str) -> list[int]:
    bits: list[int] = []
    for char in text:
        byte_val = ord(char)
        for i in range(7, -1, -1):
            bits.append((byte_val >> i) & 1)
    return bits


def build_payload_bits(token: str) -> list[int]:
    token_bits = string_to_bits(token)
    n_bits = len(token_bits)
    header_bits = [(n_bits >> (15 - i)) & 1 for i in range(16)]
    delimiter_bits = [0] * 16 + [1] * 16
    return header_bits + token_bits + delimiter_bits


def bits_to_string(bits: list[int]) -> str:
    chars: list[str] = []
    for i in range(0, len(bits) - 7, 8):
        byte_bits = bits[i : i + 8]
        byte_val = 0
        for b in byte_bits:
            byte_val = (byte_val << 1) | b
        chars.append(chr(byte_val))
    return "".join(chars)


def sanitise_token(raw_token: str) -> str:
    cleaned = "".join(
        c for c in raw_token if 32 <= ord(c) <= 126
    )
    if len(cleaned) > 64:
        cleaned = cleaned[:64]
    elif len(cleaned) < 64:
        cleaned = cleaned.ljust(64, " ")
    return cleaned


def embed_dct(image_bytes: bytes, token: str) -> bytes:
    """Quantization-table-aware DCT embedding with 3× repetition coding.

    Each payload bit is embedded in 3 consecutive 8×8 blocks at 3 different
    coefficient positions with different JPEG quantization factors (Q=12, 10, 11).
    During extraction, majority voting recovers the original bit even if one
    or two copies are corrupted by JPEG re-compression.
    """
    rgb_image = load_rgb_from_bytes(image_bytes)
    if len(rgb_image.shape) != 3 or rgb_image.shape[2] != 3:
        raise ValueError("Image must be 3-channel RGB.")

    H, W, _ = rgb_image.shape
    ycbcr = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2YCrCb)
    Y, Cr, Cb = cv2.split(ycbcr)
    Y_float = Y.astype(np.float32)

    sanitised = sanitise_token(token)
    payload_bits = build_payload_bits(sanitised)

    blocks_needed = len(payload_bits) * 3
    num_blocks = (H // 8) * (W // 8)
    if blocks_needed > num_blocks:
        raise ValueError(
            f"Payload ({len(payload_bits)} bits × 3 = {blocks_needed} blocks) "
            f"exceeds image capacity ({num_blocks} blocks)."
        )

    def embed_one(dct_b, row, col, q_factor, bit):
        coeff = dct_b[row, col]
        q_val = coeff / q_factor
        q_idx = int(round(q_val))
        if (abs(q_idx) % 2) != bit:
            cand_p = q_idx + 1 if q_idx >= 0 else q_idx - 1
            cand_n = q_idx - 1 if q_idx >= 0 else q_idx + 1
            err_p = abs(cand_p * q_factor - coeff)
            err_n = abs(cand_n * q_factor - coeff)
            q_idx = cand_p if err_p <= err_n else cand_n
        return q_idx * q_factor

    def verify_roundtrip(dct_b, cr_b, cb_b, row, col, q_factor, bit):
        idct = cv2.idct(dct_b)
        u8 = np.clip(np.round(idct), 0, 255).astype(np.uint8)
        yc = cv2.merge([u8, cr_b, cb_b])
        rg = cv2.cvtColor(yc, cv2.COLOR_YCrCb2RGB)
        yc2 = cv2.cvtColor(rg, cv2.COLOR_RGB2YCrCb)
        y2 = cv2.split(yc2)[0].astype(np.float32)
        re = cv2.dct(y2)
        re_q = int(round(re[row, col] / q_factor))
        return (abs(re_q) % 2) == bit

    bit_index = 0
    blocks_flat = [(r, c) for r in range(0, H, 8) for c in range(0, W, 8)]

    for idx in range(0, len(blocks_flat), 3):
        if bit_index >= len(payload_bits):
            break
        bit = payload_bits[bit_index]

        for copy_i in range(3):
            if idx + copy_i >= len(blocks_flat):
                break
            r, c = blocks_flat[idx + copy_i]
            pos_r, pos_c, qf = EMBED_POSITIONS[copy_i]

            block = Y_float[r:r+8, c:c+8].copy()
            dct_b = cv2.dct(block)

            new_coeff = embed_one(dct_b, pos_r, pos_c, qf, bit)
            dct_b[pos_r, pos_c] = new_coeff

            cr_b = Cr[r:r+8, c:c+8]
            cb_b = Cb[r:r+8, c:c+8]

            if not verify_roundtrip(dct_b, cr_b, cb_b, pos_r, pos_c, qf, bit):
                for _ in range(8):
                    q_idx = int(round(dct_b[pos_r, pos_c] / qf))
                    q_idx = q_idx + 1 if q_idx >= 0 else q_idx - 1
                    dct_b[pos_r, pos_c] = q_idx * qf
                    if verify_roundtrip(dct_b, cr_b, cb_b, pos_r, pos_c, qf, bit):
                        break

            idct_b = cv2.idct(dct_b)
            Y_float[r:r+8, c:c+8] = np.clip(idct_b, 0, 255)

        bit_index += 1

    Y_mod = np.round(Y_float).clip(0, 255).astype(np.uint8)
    stego_ycbcr = cv2.merge([Y_mod, Cr, Cb])
    stego_rgb = cv2.cvtColor(stego_ycbcr, cv2.COLOR_YCrCb2RGB)
    stego_bgr = cv2.cvtColor(stego_rgb, cv2.COLOR_RGB2BGR)

    success, buffer = cv2.imencode(".png", stego_bgr)
    if not success:
        raise ValueError("Failed to encode stego image to PNG format.")
    return buffer.tobytes()


def extract_dct(stego_bytes: bytes) -> str:
    """Extract token with majority-voting from 3× repetition-coded DCT stego.

    Reads 3 consecutive blocks per payload bit, extracts the parity from
    each at different DCT coefficient positions, and recovers the bit
    via majority voting.
    """
    rgb_image = load_rgb_from_bytes(stego_bytes)
    if len(rgb_image.shape) != 3 or rgb_image.shape[2] != 3:
        raise ValueError("Stego image must be 3-channel RGB.")

    H, W, _ = rgb_image.shape
    ycbcr = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2YCrCb)
    Y, _, _ = cv2.split(ycbcr)
    Y_float = Y.astype(np.float32)

    def read_parity(r, c, pos_r, pos_c, qf):
        block = Y_float[r:r+8, c:c+8]
        dct_b = cv2.dct(block)
        q_idx = int(round(dct_b[pos_r, pos_c] / qf))
        return abs(q_idx) % 2

    blocks_flat = [(r, c) for r in range(0, H, 8) for c in range(0, W, 8)]
    recovered_bits: list[int] = []

    for idx in range(0, len(blocks_flat), 3):
        votes = []
        for copy_i in range(3):
            if idx + copy_i >= len(blocks_flat):
                break
            r, c = blocks_flat[idx + copy_i]
            pos_r, pos_c, qf = EMBED_POSITIONS[copy_i]
            votes.append(read_parity(r, c, pos_r, pos_c, qf))
        recovered_bits.append(1 if sum(votes) >= 2 else 0)

    p = recovered_bits
    n_bits = 0
    for b in p[:16]:
        n_bits = (n_bits << 1) | b

    if n_bits <= 0 or n_bits > len(p) - 16 - 32:
        raise ValueError(f"Invalid payload header: n_bits={n_bits}")

    token_bits = p[16:16 + n_bits]
    return bits_to_string(token_bits)
