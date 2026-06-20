import base64
import io

import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app, raise_server_exceptions=False)


def _create_test_png(width: int = 512, height: int = 512, seed: int = 42) -> bytes:
    np.random.seed(seed)
    img = np.random.randint(0, 256, (height, width, 3), dtype=np.uint8)
    success, buf = cv2.imencode(".png", cv2.cvtColor(img, cv2.COLOR_RGB2BGR))
    return buf.tobytes()


def _create_test_jpeg(width: int = 512, height: int = 512) -> bytes:
    img = np.random.randint(0, 256, (height, width, 3), dtype=np.uint8)
    success, buf = cv2.imencode(".jpg", cv2.cvtColor(img, cv2.COLOR_RGB2BGR), [int(cv2.IMWRITE_JPEG_QUALITY), 95])
    return buf.tobytes()


def _files_and_data(image_bytes: bytes, token: str = "A" * 64, **extra) -> tuple[dict, dict]:
    files = {"image": ("test.png", io.BytesIO(image_bytes), "image/png")}
    data = {"token": token, **extra}
    return files, data


class TestHealthEndpoint:
    def test_health_returns_200(self):
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "version" in data


class TestEmbedLSBEndpoint:
    def test_embed_lsb_success(self):
        png_bytes = _create_test_png()
        files, data = _files_and_data(png_bytes, "A" * 64)
        response = client.post("/api/v1/embed/lsb", files=files, data=data)
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["technique"] == "LSB"
        assert "stego_image_b64" in body
        assert "heatmap_b64" in body
        assert "metrics" in body
        assert "sanitised_token" in body
        assert body["sanitised_token"] == "A" * 64
        assert body["token_length_bits"] == 512

    def test_embed_lsb_missing_token(self):
        png_bytes = _create_test_png()
        response = client.post(
            "/api/v1/embed/lsb",
            files={"image": ("test.png", io.BytesIO(png_bytes), "image/png")},
        )
        assert response.status_code == 422

    def test_embed_lsb_invalid_mime_type(self):
        bad_data = b"not an image"
        response = client.post(
            "/api/v1/embed/lsb",
            files={"image": ("test.png", io.BytesIO(bad_data), "image/png")},
            data={"token": "A" * 64},
        )
        assert response.status_code in (400, 415, 422, 500)

    def test_embed_lsb_small_image(self):
        small_png = _create_test_png(width=4, height=4)
        files, data = _files_and_data(small_png, "A" * 64)
        response = client.post("/api/v1/embed/lsb", files=files, data=data)
        assert response.status_code in (400, 415, 422, 500)

    def test_embed_lsb_different_token_lengths(self):
        for length in [1, 8, 32, 64]:
            png_bytes = _create_test_png(width=256, height=256)
            files, data = _files_and_data(png_bytes, "A" * length)
            response = client.post("/api/v1/embed/lsb", files=files, data=data)
            assert response.status_code == 200, f"Failed for length {length}: {response.text}"
            body = response.json()
            assert body["token_length_bits"] == 512  # sanitise_token pads to 64 chars

    def test_embed_lsb_jpeg_input(self):
        jpeg_bytes = _create_test_jpeg()
        files, data = _files_and_data(jpeg_bytes, "A" * 64)
        response = client.post("/api/v1/embed/lsb", files=files, data=data)
        assert response.status_code == 200, response.text

    def test_embed_lsb_metrics_present(self):
        png_bytes = _create_test_png()
        files, data = _files_and_data(png_bytes, "A" * 64)
        response = client.post("/api/v1/embed/lsb", files=files, data=data)
        body = response.json()
        metrics = body["metrics"]
        for key in ("mse", "psnr", "ssim", "capacity_bits", "capacity_bytes", "processing_time_ms"):
            assert key in metrics, f"Missing metric key: {key}"


class TestEmbedDCTEndpoint:
    def test_embed_dct_success(self):
        png_bytes = _create_test_png()
        files, data = _files_and_data(png_bytes, "A" * 64)
        response = client.post("/api/v1/embed/dct", files=files, data=data)
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["technique"] == "DCT"
        assert "stego_image_b64" in body
        assert "heatmap_b64" in body
        assert "metrics" in body
        assert body["sanitised_token"] == "A" * 64

    def test_embed_dct_invalid_mime_type(self):
        bad_data = b"not an image"
        response = client.post(
            "/api/v1/embed/dct",
            files={"image": ("test.png", io.BytesIO(bad_data), "image/png")},
            data={"token": "A" * 64},
        )
        assert response.status_code in (400, 415, 422, 500)

    def test_embed_dct_small_image(self):
        small_png = _create_test_png(width=16, height=16)
        files, data = _files_and_data(small_png, "A" * 64)
        response = client.post("/api/v1/embed/dct", files=files, data=data)
        assert response.status_code in (400, 415, 422, 500)

    def test_embed_dct_different_token_lengths(self):
        for length in [1, 8, 32, 64]:
            png_bytes = _create_test_png(width=256, height=256)
            files, data = _files_and_data(png_bytes, "A" * length)
            response = client.post("/api/v1/embed/dct", files=files, data=data)
            assert response.status_code == 200, f"Failed for length {length}: {response.text}"

    def test_embed_dct_metrics_present(self):
        png_bytes = _create_test_png()
        files, data = _files_and_data(png_bytes, "A" * 64)
        response = client.post("/api/v1/embed/dct", files=files, data=data)
        body = response.json()
        metrics = body["metrics"]
        for key in ("mse", "psnr", "ssim", "capacity_bits", "capacity_bytes", "processing_time_ms"):
            assert key in metrics, f"Missing metric key: {key}"


class TestExtractLSBEndpoint:
    def test_extract_lsb_roundtrip(self):
        token = "B" * 64
        png_bytes = _create_test_png()
        files, data = _files_and_data(png_bytes, token)
        embed_resp = client.post("/api/v1/embed/lsb", files=files, data=data)
        assert embed_resp.status_code == 200, embed_resp.text
        stego_b64 = embed_resp.json()["stego_image_b64"]
        stego_bytes = base64.b64decode(stego_b64)

        extract_resp = client.post(
            "/api/v1/extract/lsb",
            files={"stego_image": ("stego.png", io.BytesIO(stego_bytes), "image/png")},
        )
        assert extract_resp.status_code == 200, extract_resp.text
        body = extract_resp.json()
        assert body["extracted_token"] == token
        assert body["technique"] == "LSB"

    def test_extract_lsb_invalid_input(self):
        response = client.post(
            "/api/v1/extract/lsb",
            files={"stego_image": ("bad.png", io.BytesIO(b"notanimage"), "image/png")},
        )
        assert response.status_code == 415


class TestExtractDCTEndpoint:
    def test_extract_dct_roundtrip(self):
        token = "C" * 64
        png_bytes = _create_test_png()
        files, data = _files_and_data(png_bytes, token)
        embed_resp = client.post("/api/v1/embed/dct", files=files, data=data)
        assert embed_resp.status_code == 200, embed_resp.text
        stego_b64 = embed_resp.json()["stego_image_b64"]
        stego_bytes = base64.b64decode(stego_b64)

        extract_resp = client.post(
            "/api/v1/extract/dct",
            files={"stego_image": ("stego.png", io.BytesIO(stego_bytes), "image/png")},
        )
        assert extract_resp.status_code == 200, extract_resp.text
        body = extract_resp.json()
        assert body["extracted_token"] == token
        assert body["technique"] == "DCT"

    def test_extract_dct_invalid_input(self):
        response = client.post(
            "/api/v1/extract/dct",
            files={"stego_image": ("bad.png", io.BytesIO(b"notanimage"), "image/png")},
        )
        assert response.status_code == 415


class TestCompareEndpoint:
    def test_compare_success(self):
        png_bytes = _create_test_png()
        files, data = _files_and_data(png_bytes, "A" * 64)
        response = client.post("/api/v1/compare", files=files, data=data)
        assert response.status_code == 200, response.text
        body = response.json()
        assert "original_b64" in body
        assert "lsb_stego_b64" in body
        assert "dct_stego_b64" in body
        assert "lsb_heatmap_b64" in body
        assert "dct_heatmap_b64" in body
        assert "lsb_metrics" in body
        assert "dct_metrics" in body
        assert "verdict" in body
        assert body["verdict"]["recommended_for_authentication"] in ("LSB", "DCT")

    def test_compare_invalid_file(self):
        response = client.post(
            "/api/v1/compare",
            files={"image": ("test.png", io.BytesIO(b"bad"), "image/png")},
            data={"token": "A" * 64},
        )
        assert response.status_code in (400, 415, 422, 500)


class TestRobustnessEndpoint:
    def test_robustness_success(self):
        png_bytes = _create_test_png()
        files, data = _files_and_data(png_bytes, "A" * 64, quality_factors="90,75")
        response = client.post("/api/v1/robustness", files=files, data=data)
        assert response.status_code == 200, response.text
        body = response.json()
        assert "results" in body
        assert "recommendation" in body
        assert len(body["results"]) == 2

    def test_robustness_default_quality_factors(self):
        png_bytes = _create_test_png()
        files, data = _files_and_data(png_bytes, "A" * 64)
        response = client.post("/api/v1/robustness", files=files, data=data)
        assert response.status_code == 200, response.text
        body = response.json()
        assert len(body["results"]) == 5

    def test_robustness_empty_quality_factors(self):
        png_bytes = _create_test_png()
        files, data = _files_and_data(png_bytes, "A" * 64, quality_factors="")
        response = client.post("/api/v1/robustness", files=files, data=data)
        assert response.status_code == 200, response.text
        assert len(response.json()["results"]) == 5


class TestReportEndpoint:
    def test_report_generation_success(self):
        payload = {
            "original_b64": "",
            "lsb_stego_b64": "",
            "dct_stego_b64": "",
            "lsb_heatmap_b64": "",
            "dct_heatmap_b64": "",
            "lsb_metrics": {"mse": 0.5, "psnr": 45.0, "ssim": 0.99, "capacity_bits": 786432, "capacity_bytes": 98304, "processing_time_ms": 50.0},
            "dct_metrics": {"mse": 2.0, "psnr": 42.0, "ssim": 0.97, "capacity_bits": 4096, "capacity_bytes": 512, "processing_time_ms": 100.0},
            "robustness_results": [],
            "verdict": {"recommended_for_authentication": "DCT", "better_imperceptibility": "LSB", "better_robustness": "DCT", "better_capacity": "LSB", "rq1_answer": "LSB", "rq3_answer": "LSB", "rq4_answer": "DCT"},
            "original_token": "A" * 64,
            "extracted_token": "A" * 64,
            "token_match": True,
        }
        response = client.post("/api/v1/report/generate", json=payload)
        assert response.status_code == 200, response.text
        assert response.headers["content-type"] == "application/pdf"
        assert len(response.content) > 100

    def test_report_invalid_payload(self):
        response = client.post("/api/v1/report/generate", json={"bad": "data"})
        assert response.status_code == 200  # endpoint accepts all fields with defaults
