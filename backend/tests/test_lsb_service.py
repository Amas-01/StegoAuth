"""Unit tests for lsb_service.py — embed + extract roundtrip, BER=0, capacity check."""

import numpy as np
import cv2
import pytest

from app.services.lsb_service import (
    embed_lsb,
    extract_lsb,
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


TEST_TOKEN = "A" * 64  # 64-char test token for consistent testing
assert len(TEST_TOKEN) == 64, "Test token must be exactly 64 characters"


class TestHelperFunctions:
    def test_string_to_bits_length(self):
        bits = string_to_bits("A")
        assert len(bits) == 8, "Single char should produce 8 bits"
        assert bits == [0, 1, 0, 0, 0, 0, 0, 1], "ASCII 'A' bit pattern incorrect"

    def test_string_to_bits_multiple_chars(self):
        bits = string_to_bits("AB")
        assert len(bits) == 16

    def test_bits_to_string_roundtrip(self):
        original = "HELLO"
        bits = string_to_bits(original)
        recovered = bits_to_string(bits)
        assert recovered == original

    def test_build_payload_bits_structure(self):
        token = sanitise_token(TEST_TOKEN)
        payload = build_payload_bits(token)
        assert len(payload) == 560, "64-char token should produce 560-bit payload"

        # First 16 bits = header
        header = payload[:16]
        n_bits = 0
        for b in header:
            n_bits = (n_bits << 1) | b
        assert n_bits == 512, "Header should encode 512 token bits"

        # Last 32 bits = delimiter
        delimiter = payload[-32:]
        assert delimiter[:16] == [0] * 16, "First 16 delimiter bits should be 0"
        assert delimiter[16:] == [1] * 16, "Last 16 delimiter bits should be 1"

    def test_sanitise_token_truncate(self):
        long_token = "A" * 100
        result = sanitise_token(long_token)
        assert len(result) == 64

    def test_sanitise_token_pad(self):
        short_token = "ABC"
        result = sanitise_token(short_token)
        assert len(result) == 64
        assert result == "ABC" + " " * 61

    def test_sanitise_token_remove_control_chars(self):
        dirty = "A\x00B\x01C\nD"
        result = sanitise_token(dirty)
        assert "\x00" not in result
        assert "\x01" not in result
        assert "\n" not in result
        assert len(result) == 64

    def test_sanitise_token_printable_only(self):
        dirty = "ABC\x80\xFF\x7F"
        result = sanitise_token(dirty)
        assert all(32 <= ord(c) <= 126 for c in result.strip())


class TestLSBEmbedExtract:
    def test_embed_and_extract_roundtrip(self):
        image_bytes = _create_test_image()
        stego_bytes = embed_lsb(image_bytes, TEST_TOKEN)
        extracted = extract_lsb(stego_bytes)
        assert extracted == sanitise_token(TEST_TOKEN), (
            f"Extracted token mismatch. Got: '{extracted}'"
        )

    def test_ber_zero_on_png(self):
        """BER should be 0.0 for PNG stego (no compression)."""
        image_bytes = _create_test_image()
        stego_bytes = embed_lsb(image_bytes, TEST_TOKEN)
        extracted = extract_lsb(stego_bytes)
        expected = sanitise_token(TEST_TOKEN)

        from app.services.metrics_service import compute_ber
        ber = compute_ber(expected, extracted)
        assert ber == 0.0, f"BER should be 0.0 on PNG, got {ber}"

    def test_capacity_sufficient(self):
        """Verify capacity check passes for test images."""
        image_bytes = _create_test_image()
        stego_bytes = embed_lsb(image_bytes, TEST_TOKEN)
        assert len(stego_bytes) > 0

    def test_embed_with_different_tokens(self):
        """Different tokens should produce different stego images."""
        image_bytes = _create_test_image()
        stego1 = embed_lsb(image_bytes, "A" * 64)
        stego2 = embed_lsb(image_bytes, "B" * 64)
        assert stego1 != stego2

    def test_small_image_raises_error(self):
        """Very small image should raise error for 64-char token."""
        image_bytes = _create_test_image(width=8, height=8)
        with pytest.raises(ValueError):
            embed_lsb(image_bytes, TEST_TOKEN)

    def test_extract_different_token(self):
        """Embed one token, verify a different one doesn't match."""
        image_bytes = _create_test_image()
        stego_bytes = embed_lsb(image_bytes, "A" * 64)
        extracted = extract_lsb(stego_bytes)
        assert extracted != "B" * 64

    def test_invalid_image_bytes_raises(self):
        with pytest.raises(ValueError):
            embed_lsb(b"not an image", TEST_TOKEN)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
