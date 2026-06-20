import cv2
import numpy as np

from app.utils.image_utils import load_rgb_from_bytes, encode_to_png_bytes


def string_to_bits(text: str) -> list[int]:
    """Convert ASCII string to a flat list of integer bits, MSB first per character.

    Args:
        text: ASCII string to convert.

    Returns:
        List of integer bits (0 or 1), 8 bits per character.
    """
    bits: list[int] = []
    for char in text:
        byte_val = ord(char)
        for i in range(7, -1, -1):  # bit 7 (MSB) down to bit 0 (LSB)
            bits.append((byte_val >> i) & 1)
    return bits


def build_payload_bits(token: str) -> list[int]:
    """Build the full payload bit sequence.

    Structure: [16-bit length header] + [token bits] + [32-bit delimiter]

    The 16-bit header encodes the total number of token bits as an unsigned
    integer, big-endian, MSB first. The 32-bit delimiter is 16 zero bits
    followed by 16 one bits.

    Args:
        token: Sanitised 64-character ASCII token.

    Returns:
        Complete payload bit sequence (560 bits for a 64-char token).
    """
    token_bits = string_to_bits(token)
    n_bits = len(token_bits)  # 512 for a 64-char token

    # 16-bit header — encode n_bits as unsigned int, MSB first
    header_bits = [(n_bits >> (15 - i)) & 1 for i in range(16)]

    # 32-bit delimiter: 16 zeros + 16 ones
    delimiter_bits = [0] * 16 + [1] * 16

    return header_bits + token_bits + delimiter_bits


def bits_to_string(bits: list[int]) -> str:
    """Convert a flat list of bits (MSB first per byte) back to an ASCII string.

    Args:
        bits: List of integer bits (0 or 1).

    Returns:
        Reconstructed ASCII string.
    """
    chars: list[str] = []
    for i in range(0, len(bits) - 7, 8):
        byte_bits = bits[i : i + 8]
        byte_val = 0
        for b in byte_bits:
            byte_val = (byte_val << 1) | b
        chars.append(chr(byte_val))
    return "".join(chars)


def sanitise_token(raw_token: str) -> str:
    """Sanitise user-supplied authentication token to exactly 64 printable ASCII chars.

    Strips non-ASCII, removes control characters, truncates or pads as needed.

    Args:
        raw_token: User-supplied token string.

    Returns:
        Sanitised token of exactly 64 printable ASCII characters.
    """
    cleaned = "".join(
        c for c in raw_token
        if 32 <= ord(c) <= 126  # printable ASCII only
    )
    if len(cleaned) > 64:
        cleaned = cleaned[:64]
    elif len(cleaned) < 64:
        cleaned = cleaned.ljust(64, " ")
    return cleaned


def embed_dct(image_bytes: bytes, token: str) -> bytes:
    """Embed an authentication token into an image using DCT steganography.

    Operates in the frequency domain by modifying DCT transform coefficients.
    Uses YCbCr colour space and embeds ONLY in the luminance (Y) channel.
    The image is divided into non-overlapping 8×8 pixel blocks. One bit is
    embedded per block at coefficient position [0, 2] (zigzag position 5).

    Parity scheme: even rounded value = bit 0, odd rounded value = bit 1.
    If parity does not match: increment or decrement coefficient by 1.0.

    Args:
        image_bytes: Raw bytes of the cover image (JPEG or PNG).
        token: Authentication token to embed (will be sanitised to 64 chars).

    Returns:
        Stego image as PNG bytes with embedded token.

    Raises:
        ValueError: If image cannot be decoded or payload exceeds capacity.
    """
    # Step 1: Load image, verify 3-channel RGB, convert to YCbCr
    rgb_image = load_rgb_from_bytes(image_bytes)

    if len(rgb_image.shape) != 3 or rgb_image.shape[2] != 3:
        raise ValueError("Image must be 3-channel RGB.")

    H, W, _ = rgb_image.shape

    # Convert RGB → YCbCr (OpenCV uses YCrCb order)
    ycbcr = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2YCrCb)
    Y, Cr, Cb = cv2.split(ycbcr)

    # Cast Y to float32 for DCT processing
    Y_float = Y.astype(np.float32)

    # Step 2: Build payload
    sanitised = sanitise_token(token)
    payload_bits = build_payload_bits(sanitised)

    # Calculate number of blocks
    num_blocks = (H // 8) * (W // 8)
    if len(payload_bits) > num_blocks:
        raise ValueError(
            f"Payload ({len(payload_bits)} bits) exceeds image capacity "
            f"({num_blocks} blocks = {num_blocks} bits)."
        )

    # Step 3: Process each 8×8 block in row-major order
    bit_index = 0
    for row in range(0, H, 8):
        for col in range(0, W, 8):
            if bit_index >= len(payload_bits):
                break

            # Extract 8×8 block
            block = Y_float[row : row + 8, col : col + 8].copy()

            # Apply 2D DCT
            dct_block = cv2.dct(block)

            # Step 4: Read coefficient at position [0, 2]
            coeff = dct_block[0, 2]

            # Compute parity using absolute value
            coeff_rounded = int(round(coeff))
            current_parity = abs(coeff_rounded) % 2
            target_bit = payload_bits[bit_index]

            # Step 5: Modify coefficient as needed.
            # Use iterative approach: try increasing modifications until the
            # parity survives the full IDCT → uint8 → color roundtrip → DCT cycle.
            # The color roundtrip (YCbCr→RGB→YCbCr) introduces ±1 noise in Y,
            # which shifts the DCT coefficient by up to ~0.5 — enough to flip
            # parity for coefficients near a rounding boundary.
            cr_block = Cr[row : row + 8, col : col + 8]
            cb_block = Cb[row : row + 8, col : col + 8]
            sign = 1.0 if coeff >= 0 else -1.0

            for mod_amount in range(0, 33):
                test_dct_coeff = coeff if mod_amount == 0 else coeff + sign * mod_amount
                test_dct = dct_block.copy()
                test_dct[0, 2] = test_dct_coeff
                test_idct = cv2.idct(test_dct)
                test_u8 = np.clip(np.round(test_idct), 0, 255).astype(np.uint8)

                # Simulate full roundtrip including color conversion
                test_ycbcr = cv2.merge([test_u8, cr_block, cb_block])
                test_rgb = cv2.cvtColor(test_ycbcr, cv2.COLOR_YCrCb2RGB)
                test_ycbcr2 = cv2.cvtColor(test_rgb, cv2.COLOR_RGB2YCrCb)
                test_Y2 = cv2.split(test_ycbcr2)[0].astype(np.float32)
                full_re_dct = cv2.dct(test_Y2)
                full_parity = abs(int(round(full_re_dct[0, 2]))) % 2

                if full_parity == target_bit:
                    dct_block[0, 2] = test_dct_coeff
                    break

            # Step 6: Apply Inverse DCT
            idct_block = cv2.idct(dct_block)

            # Clip to valid range and write back
            Y_float[row : row + 8, col : col + 8] = np.clip(idct_block, 0, 255)

            bit_index += 1

        if bit_index >= len(payload_bits):
            break

    # Step 6: Convert Y_float back to uint8 (round to minimize quantization loss)
    Y_mod = np.round(Y_float).clip(0, 255).astype(np.uint8)

    # Merge modified Y with original Cr and Cb
    stego_ycbcr = cv2.merge([Y_mod, Cr, Cb])

    # Convert YCbCr → RGB → BGR
    stego_rgb = cv2.cvtColor(stego_ycbcr, cv2.COLOR_YCrCb2RGB)
    stego_bgr = cv2.cvtColor(stego_rgb, cv2.COLOR_RGB2BGR)

    # Step 7: Encode as PNG bytes (lossless)
    success, buffer = cv2.imencode(".png", stego_bgr)
    if not success:
        raise ValueError("Failed to encode stego image to PNG format.")

    return buffer.tobytes()


def extract_dct(stego_bytes: bytes) -> str:
    """Extract an authentication token from a DCT-stego image.

    Reads the DCT coefficient at position [0, 2] of each 8×8 block
    and uses parity to recover embedded bits.

    Args:
        stego_bytes: Raw bytes of the stego image (JPEG or PNG).

    Returns:
        Extracted authentication token string.

    Raises:
        ValueError: If image cannot be decoded or extraction fails.
    """
    # Step 1: Load stego image, convert to YCbCr, split channels
    rgb_image = load_rgb_from_bytes(stego_bytes)

    if len(rgb_image.shape) != 3 or rgb_image.shape[2] != 3:
        raise ValueError("Stego image must be 3-channel RGB.")

    H, W, _ = rgb_image.shape

    # Convert to YCbCr
    ycbcr = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2YCrCb)
    Y, Cr, Cb = cv2.split(ycbcr)

    # Cast Y to float32
    Y_float = Y.astype(np.float32)

    # Step 2: Extract bits from each 8×8 block
    extracted_bits: list[int] = []
    for row in range(0, H, 8):
        for col in range(0, W, 8):
            # Extract 8×8 block
            block = Y_float[row : row + 8, col : col + 8]

            # Apply 2D DCT
            dct_block = cv2.dct(block)

            # Read coefficient at [0, 2]
            coeff = dct_block[0, 2]

            # Compute parity
            coeff_rounded = int(round(coeff))
            parity = abs(coeff_rounded) % 2
            extracted_bits.append(parity)

    # Step 3: Read first 16 bits as length header
    n_bits = 0
    for b in extracted_bits[:16]:
        n_bits = (n_bits << 1) | b

    # Validate header
    if n_bits <= 0 or n_bits > len(extracted_bits) - 16:
        raise ValueError(f"Invalid payload header: n_bits={n_bits}")

    # Step 4: Extract token bits
    token_bits = extracted_bits[16 : 16 + n_bits]

    # Step 5: Convert to string
    extracted_token = bits_to_string(token_bits)

    return extracted_token
