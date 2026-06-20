import numpy as np
import pytest

from app.services.metrics_service import (
    compute_mse,
    compute_psnr,
    compute_ssim,
    compute_ber,
    compute_capacity,
    compute_all_metrics,
)


class TestComputeMSE:
    def test_identical_images(self):
        img = np.random.randint(0, 256, (64, 64, 3), dtype=np.uint8)
        assert compute_mse(img, img) == 0.0

    def test_different_images(self):
        a = np.zeros((64, 64, 3), dtype=np.uint8)
        b = np.ones((64, 64, 3), dtype=np.uint8) * 255
        mse = compute_mse(a, b)
        assert mse > 0.0
        assert mse <= 255.0 ** 2

    def test_mse_formula(self):
        a = np.zeros((2, 2, 1), dtype=np.uint8)
        b = np.array([[[0], [0]], [[0], [2]]], dtype=np.uint8)
        mse = compute_mse(a, b)
        expected = (0 + 0 + 0 + 4) / 4.0
        assert mse == pytest.approx(expected)

    def test_mse_single_channel_handling(self):
        a = np.zeros((8, 8, 3), dtype=np.uint8)
        b = np.random.randint(0, 256, (8, 8, 3), dtype=np.uint8)
        mse = compute_mse(a, b)
        assert mse > 0.0

    def test_value_error_on_shape_mismatch(self):
        a = np.zeros((64, 64, 3), dtype=np.uint8)
        b = np.zeros((32, 32, 3), dtype=np.uint8)
        with pytest.raises(ValueError, match="operands could not be broadcast together"):
            compute_mse(a, b)


class TestComputePSNR:
    def test_inf_for_zero_mse(self):
        assert compute_psnr(0.0) == float("inf")

    def test_psnr_formula(self):
        mse = 100.0
        expected = 10.0 * np.log10(255.0 ** 2 / 100.0)
        assert compute_psnr(mse) == pytest.approx(float(expected))

    def test_high_psnr_for_low_mse(self):
        assert compute_psnr(1.0) > 40.0

    def test_low_psnr_for_high_mse(self):
        assert compute_psnr(10000.0) < 20.0

    def test_psnr_float_output(self):
        result = compute_psnr(0.5)
        assert isinstance(result, float)

    def test_psnr_roundtrip_consistency(self):
        img = np.random.randint(0, 256, (64, 64, 3), dtype=np.uint8)
        noise = np.random.randint(0, 3, (64, 64, 3), dtype=np.uint8)
        stego = np.clip(img.astype(np.int32) + noise, 0, 255).astype(np.uint8)
        mse = compute_mse(img, stego)
        psnr = compute_psnr(mse)
        assert psnr > 30.0


class TestComputeSSIM:
    def test_identical_images(self):
        img = np.random.randint(0, 256, (64, 64, 3), dtype=np.uint8)
        assert compute_ssim(img, img) == pytest.approx(1.0, abs=1e-6)

    def test_ssim_between_different_images(self):
        a = np.zeros((64, 64, 3), dtype=np.uint8)
        b = np.ones((64, 64, 3), dtype=np.uint8) * 255
        ssim = compute_ssim(a, b)
        assert -1.0 <= ssim <= 1.0
        assert ssim < 1.0

    def test_ssim_symmetric(self):
        a = np.random.randint(0, 256, (64, 64, 3), dtype=np.uint8)
        b = np.random.randint(0, 256, (64, 64, 3), dtype=np.uint8)
        assert compute_ssim(a, b) == pytest.approx(compute_ssim(b, a), abs=1e-6)

    def test_ssim_high_for_low_distortion(self):
        img = np.random.randint(0, 256, (64, 64, 3), dtype=np.uint8)
        noise = np.random.randint(0, 2, (64, 64, 3), dtype=np.uint8)
        stego = np.clip(img.astype(np.int32) + noise, 0, 255).astype(np.uint8)
        ssim = compute_ssim(img, stego)
        assert ssim > 0.90

    def test_ssim_type(self):
        img = np.zeros((64, 64, 3), dtype=np.uint8)
        result = compute_ssim(img, img)
        assert isinstance(result, float)


class TestComputeBER:
    def test_identical_tokens(self):
        assert compute_ber("hello", "hello") == 0.0

    def test_completely_different_tokens(self):
        ber = compute_ber("AAAA", "BBBB")
        assert ber > 0.0
        assert ber < 1.0

    def test_shorter_extracted_token(self):
        ber = compute_ber("ABCD", "AB")
        assert ber == 0.5  # 16 bits extracted, 16 bits missing → 16 errors / 32 total

    def test_empty_extracted_token(self):
        ber = compute_ber("ABC", "")
        assert ber == 1.0

    def test_empty_original_token(self):
        assert compute_ber("", "ABC") == 0.0

    def test_single_bit_error(self):
        assert compute_ber("A", "B") > 0.0  # A=65=01000001, B=66=01000010 → 2 bit differences

    def test_ber_range(self):
        for length in [1, 4, 16, 64]:
            original = "A" * length
            extracted = "B" * length
            ber = compute_ber(original, extracted)
            assert 0.0 <= ber <= 1.0

    def test_unicode_token(self):
        original = "héllo"
        extracted = "héllo"
        assert compute_ber(original, extracted) == 0.0

    def test_ber_returns_float(self):
        result = compute_ber("test", "tent")
        assert isinstance(result, float)


class TestComputeCapacity:
    def test_lsb_capacity(self):
        img = np.zeros((512, 512, 3), dtype=np.uint8)
        result = compute_capacity(img, "LSB")
        assert result["capacity_bits"] == 512 * 512 * 3
        assert result["capacity_bytes"] == (512 * 512 * 3) // 8
        assert result["image_dimensions"] == [512, 512]

    def test_dct_capacity(self):
        img = np.zeros((512, 512, 3), dtype=np.uint8)
        result = compute_capacity(img, "DCT")
        assert result["capacity_bits"] == (512 // 8) * (512 // 8)
        assert result["capacity_bytes"] == ((512 // 8) * (512 // 8)) // 8
        assert result["image_dimensions"] == [512, 512]

    def test_dct_capacity_non_multiple(self):
        img = np.zeros((100, 100, 3), dtype=np.uint8)
        result = compute_capacity(img, "DCT")
        assert result["capacity_bits"] == (100 // 8) * (100 // 8)

    def test_lsb_capacity_returns_dict(self):
        img = np.zeros((10, 10, 3), dtype=np.uint8)
        result = compute_capacity(img, "LSB")
        assert isinstance(result, dict)
        assert all(k in result for k in ["capacity_bits", "capacity_bytes", "image_dimensions"])

    def test_case_insensitive(self):
        img = np.zeros((64, 64, 3), dtype=np.uint8)
        assert compute_capacity(img, "lsb")["capacity_bits"] == compute_capacity(img, "LSB")["capacity_bits"]
        assert compute_capacity(img, "dct")["capacity_bits"] == compute_capacity(img, "DCT")["capacity_bits"]

    def test_unknown_technique_defaults_to_dct(self):
        img = np.zeros((64, 64, 3), dtype=np.uint8)
        result = compute_capacity(img, "UNKNOWN")
        dct_result = compute_capacity(img, "DCT")
        assert result == dct_result


class TestComputeAllMetrics:
    def test_all_metrics_returned_keys(self):
        original = np.random.randint(0, 256, (64, 64, 3), dtype=np.uint8)
        stego = np.random.randint(0, 256, (64, 64, 3), dtype=np.uint8)
        result = compute_all_metrics(original, stego, "LSB", 123.45)
        assert set(result.keys()) == {
            "mse", "psnr", "ssim", "capacity_bits", "capacity_bytes", "processing_time_ms",
        }

    def test_mse_zero_for_identical(self):
        img = np.random.randint(0, 256, (64, 64, 3), dtype=np.uint8)
        result = compute_all_metrics(img, img, "LSB", 50.0)
        assert result["mse"] == 0.0
        assert result["psnr"] == float("inf")

    def test_ssim_one_for_identical(self):
        img = np.random.randint(0, 256, (64, 64, 3), dtype=np.uint8)
        result = compute_all_metrics(img, img, "LSB", 50.0)
        assert result["ssim"] == 1.0

    def test_capacity_matches_technique(self):
        original = np.zeros((256, 256, 3), dtype=np.uint8)
        stego = np.zeros((256, 256, 3), dtype=np.uint8)
        lsb_result = compute_all_metrics(original, stego, "LSB", 0.0)
        dct_result = compute_all_metrics(original, stego, "DCT", 0.0)
        assert lsb_result["capacity_bits"] != dct_result["capacity_bits"]
        assert lsb_result["capacity_bits"] == 256 * 256 * 3
        assert dct_result["capacity_bits"] == (256 // 8) * (256 // 8)

    def test_processing_time_rounded(self):
        original = np.zeros((64, 64, 3), dtype=np.uint8)
        result = compute_all_metrics(original, original, "LSB", 123.456)
        assert result["processing_time_ms"] == 123.5
