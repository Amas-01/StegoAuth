"""Unit tests for dct_service.py — embed + extract roundtrip, BER=0, capacity check."""

import numpy as np
import cv2
import pytest

from app.services.dct_service import (
    embed_dct,
    extract_dct,
    string_to_bits,
    build_payload_bits,
    bits_to_string,
    sanitise_token,
)


def _create_test_image(width=512, height=512):
    """Create a synthetic RGB test image."""
    img = np.random.randint(0, 256, (height, width, 3), dtype=np.uint8)
    success, buffer = cv2.imencode(".png", cv2.cvtColor(img, cv2.COLOR_RGB2BGR))
    return buffer.tobytes()


TEST_TOKEN = "A" * 64
assert len(TEST_TOKEN) == 64


class TestHelperFunctions:
    def test_string_to_bits(self):
        bits = string_to_bits("A")
        assert len(bits) == 8
        assert bits == [0, 1, 0, 0, 0, 0, 0, 1]

    def test_bits_to_string_roundtrip(self):
        original = "HELLO-DCT"
        bits = string_to_bits(original)
        recovered = bits_to_string(bits)
        assert recovered == original

    def test_build_payload_bits_structure(self):
        payload = build_payload_bits(sanitise_token(TEST_TOKEN))
        assert len(payload) == 560
        header = payload[:16]
        n_bits = 0
        for b in header:
            n_bits = (n_bits << 1) | b
        assert n_bits == 512
        assert payload[-32:-16] == [0] * 16
        assert payload[-16:] == [1] * 16


class TestDCTEmbedExtract:
    def test_embed_and_extract_roundtrip(self):
        image_bytes = _create_test_image()
        stego_bytes = embed_dct(image_bytes, TEST_TOKEN)
        extracted = extract_dct(stego_bytes)
        assert extracted == sanitise_token(TEST_TOKEN), (
            f"Extracted: '{extracted}'"
        )

    def test_ber_zero_on_png(self):
        image_bytes = _create_test_image()
        stego_bytes = embed_dct(image_bytes, TEST_TOKEN)
        extracted = extract_dct(stego_bytes)
        expected = sanitise_token(TEST_TOKEN)

        from app.services.metrics_service import compute_ber
        ber = compute_ber(expected, extracted)
        assert ber == 0.0, f"BER should be 0.0 on PNG, got {ber}"

    def test_capacity_sufficient(self):
        image_bytes = _create_test_image()
        stego_bytes = embed_dct(image_bytes, TEST_TOKEN)
        assert len(stego_bytes) > 0

    def test_embed_different_tokens(self):
        image_bytes = _create_test_image()
        stego1 = embed_dct(image_bytes, "X" * 64)
        stego2 = embed_dct(image_bytes, "Y" * 64)
        assert stego1 != stego2

    def test_small_image_raises_error(self):
        """8x8 image has only 1 block = 1 bit capacity, not enough for 560 bits."""
        image_bytes = _create_test_image(width=64, height=64)
        with pytest.raises(ValueError):
            embed_dct(image_bytes, TEST_TOKEN)

    def test_extract_different_token(self):
        image_bytes = _create_test_image()
        stego_bytes = embed_dct(image_bytes, "M" * 64)
        extracted = extract_dct(stego_bytes)
        assert extracted != "N" * 64

    def test_invalid_image_bytes_raises(self):
        with pytest.raises(ValueError):
            embed_dct(b"not an image", TEST_TOKEN)

    def test_only_y_channel_modified(self):
        """Verify only Y channel is modified, Cr/Cb are preserved."""
        import numpy as np
        img_rgb = np.random.randint(0, 256, (512, 512, 3), dtype=np.uint8)
        success, buf = cv2.imencode(".png", cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR))
        original_bytes = buf.tobytes()

        stego_bytes = embed_dct(original_bytes, TEST_TOKEN)

        # Load both images
        orig_bgr = cv2.imdecode(np.frombuffer(original_bytes, np.uint8), cv2.IMREAD_COLOR)
        stego_bgr = cv2.imdecode(np.frombuffer(stego_bytes, np.uint8), cv2.IMREAD_COLOR)

        orig_rgb = cv2.cvtColor(orig_bgr, cv2.COLOR_BGR2RGB)
        stego_rgb = cv2.cvtColor(stego_bgr, cv2.COLOR_BGR2RGB)

        orig_ycbcr = cv2.cvtColor(orig_rgb, cv2.COLOR_RGB2YCrCb)
        stego_ycbcr = cv2.cvtColor(stego_rgb, cv2.COLOR_RGB2YCrCb)

        orig_Y, orig_Cr, orig_Cb = cv2.split(orig_ycbcr)
        stego_Y, stego_Cr, stego_Cb = cv2.split(stego_ycbcr)

        # Cr and Cb should be preserved within ±1 (minor rounding from YCbCr→RGB→YCbCr)
        cr_diff = np.max(np.abs(orig_Cr.astype(np.int32) - stego_Cr.astype(np.int32)))
        cb_diff = np.max(np.abs(orig_Cb.astype(np.int32) - stego_Cb.astype(np.int32)))
        assert cr_diff <= 2, f"Cr channel max diff {cr_diff} exceeds 2"
        assert cb_diff <= 2, f"Cb channel max diff {cb_diff} exceeds 2"

        # Y channel should differ (at least in some blocks)
        assert not np.array_equal(orig_Y, stego_Y), "Y channel should be modified"

    def test_dct_coefficient_position(self):
        """Verify embedding is at DCT coefficient [0, 2]."""
        import numpy as np
        img_rgb = np.random.randint(0, 256, (512, 512, 3), dtype=np.uint8)
        success, buf = cv2.imencode(".png", cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR))
        original_bytes = buf.tobytes()

        stego_bytes = embed_dct(original_bytes, TEST_TOKEN)

        stego_bgr = cv2.imdecode(np.frombuffer(stego_bytes, np.uint8), cv2.IMREAD_COLOR)
        stego_rgb = cv2.cvtColor(stego_bgr, cv2.COLOR_BGR2RGB)
        stego_ycbcr = cv2.cvtColor(stego_rgb, cv2.COLOR_RGB2YCrCb)
        Y, _, _ = cv2.split(stego_ycbcr)
        Y_float = Y.astype(np.float32)

        # Check extraction via coefficient parity
        extracted_bits = []
        for row in range(0, 512, 8):
            for col in range(0, 512, 8):
                block = Y_float[row:row+8, col:col+8]
                dct_block = cv2.dct(block)
                coeff = dct_block[0, 2]
                parity = abs(int(round(coeff))) % 2
                extracted_bits.append(parity)

        # First 16 bits should decode to 512
        n_bits = 0
        for b in extracted_bits[:16]:
            n_bits = (n_bits << 1) | b
        assert n_bits == 512, f"Header should decode to 512, got {n_bits}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
