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


def embed_lsb(image_bytes: bytes, token: str) -> bytes:
    """Embed an authentication token into an image using LSB steganography.

    Modifies exactly 1 least significant bit per colour channel per pixel
    in raster-scan order (left to right, top to bottom, R then G then B).

    Args:
        image_bytes: Raw bytes of the cover image (JPEG or PNG).
        token: Authentication token to embed (will be sanitised to 64 chars).

    Returns:
        Stego image as PNG bytes with embedded token.

    Raises:
        ValueError: If image cannot be decoded or payload exceeds capacity.
    """
    # Step 1: Load image and convert to RGB
    rgb_image = load_rgb_from_bytes(image_bytes)

    # Verify 3-channel RGB
    if len(rgb_image.shape) != 3 or rgb_image.shape[2] != 3:
        raise ValueError("Image must be 3-channel RGB.")

    H, W, C = rgb_image.shape

    # Step 2: Build payload
    sanitised = sanitise_token(token)
    payload_bits = build_payload_bits(sanitised)

    # Confirm capacity
    capacity = H * W * C
    if len(payload_bits) > capacity:
        raise ValueError(
            f"Payload ({len(payload_bits)} bits) exceeds image capacity ({capacity} bits)."
        )

    # Step 3: Flatten pixel array to 1D
    flat = rgb_image.flatten().astype(np.uint8)

    # Step 4: Embed each bit using LSB replacement
    for i in range(len(payload_bits)):
        flat[i] = (flat[i] & 0xFE) | int(payload_bits[i])

    # Step 5: Reshape back to original image shape
    stego_rgb = flat.reshape(rgb_image.shape)

    # Step 6: Convert RGB → BGR for OpenCV, encode as PNG (lossless)
    stego_bgr = cv2.cvtColor(stego_rgb.astype(np.uint8), cv2.COLOR_RGB2BGR)
    success, buffer = cv2.imencode(".png", stego_bgr)
    if not success:
        raise ValueError("Failed to encode stego image to PNG format.")

    return buffer.tobytes()


def extract_lsb(stego_bytes: bytes) -> str:
    """Extract an authentication token from an LSB-stego image.

    Reads the LSB of each channel value in raster-scan order to recover
    the embedded payload, then decodes the length header and token bits.

    Args:
        stego_bytes: Raw bytes of the stego image (JPEG or PNG).

    Returns:
        Extracted authentication token string.

    Raises:
        ValueError: If image cannot be decoded or extraction fails.
    """
    # Step 1: Load stego image, convert to RGB
    rgb_image = load_rgb_from_bytes(stego_bytes)

    if len(rgb_image.shape) != 3 or rgb_image.shape[2] != 3:
        raise ValueError("Stego image must be 3-channel RGB.")

    # Step 2: Flatten pixel array to 1D
    flat = rgb_image.flatten().astype(np.uint8)

    # Step 3: Extract LSB from each channel value
    extracted_bits = [int(v & 0x01) for v in flat]

    # Step 4: Read first 16 bits as length header
    n_bits = 0
    for b in extracted_bits[:16]:
        n_bits = (n_bits << 1) | b

    # Validate header
    if n_bits <= 0 or n_bits > len(extracted_bits) - 16:
        raise ValueError(f"Invalid payload header: n_bits={n_bits}")

    # Step 5: Extract token bits
    token_bits = extracted_bits[16 : 16 + n_bits]

    # Step 6: Convert bits to string
    extracted_token = bits_to_string(token_bits)

    return extracted_token
