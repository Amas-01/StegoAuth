import base64
from datetime import datetime

try:
    from weasyprint import HTML

    _weasyprint_available = True
except ImportError:
    _weasyprint_available = False


def image_to_base64(image_bytes: bytes) -> str:
    """Encode raw image bytes as a base64 string for JSON transport."""
    return base64.b64encode(image_bytes).decode("utf-8")


def base64_to_image(b64_string: str) -> bytes:
    """Decode a base64 string back to raw image bytes."""
    return base64.b64decode(b64_string)


def _build_html_report(data: dict) -> str:
    """Build an HTML document for the PDF report.

    Args:
        data: Session data dictionary containing images (as base64 strings),
            metrics, robustness results, and token information.

    Returns:
        Complete HTML string for WeasyPrint rendering.
    """
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Safely extract fields with defaults
    original_b64 = data.get("original_b64", "")
    lsb_stego_b64 = data.get("lsb_stego_b64", "")
    dct_stego_b64 = data.get("dct_stego_b64", "")
    lsb_heatmap_b64 = data.get("lsb_heatmap_b64", "")
    dct_heatmap_b64 = data.get("dct_heatmap_b64", "")

    lsb_metrics = data.get("lsb_metrics", {})
    dct_metrics = data.get("dct_metrics", {})
    robustness_results = data.get("robustness_results", [])
    verdict = data.get("verdict", {})
    extracted_token = data.get("extracted_token", "")
    original_token = data.get("original_token", "")
    token_match = data.get("token_match", False)

    def fmt(val, decimals=2):
        if isinstance(val, (int, float)):
            return f"{val:.{decimals}f}"
        return str(val) if val else "N/A"

    # Metrics rows
    metrics_rows = f"""
    <tr><td>MSE</td><td>{fmt(lsb_metrics.get('mse'), 4)}</td><td>{fmt(dct_metrics.get('mse'), 4)}</td></tr>
    <tr><td>PSNR (dB)</td><td>{fmt(lsb_metrics.get('psnr'))}</td><td>{fmt(dct_metrics.get('psnr'))}</td></tr>
    <tr><td>SSIM</td><td>{fmt(lsb_metrics.get('ssim'), 6)}</td><td>{fmt(dct_metrics.get('ssim'), 6)}</td></tr>
    <tr><td>Capacity (bits)</td><td>{fmt(lsb_metrics.get('capacity_bits'), 0)}</td><td>{fmt(dct_metrics.get('capacity_bits'), 0)}</td></tr>
    <tr><td>Capacity (bytes)</td><td>{fmt(lsb_metrics.get('capacity_bytes'), 0)}</td><td>{fmt(dct_metrics.get('capacity_bytes'), 0)}</td></tr>
    <tr><td>Processing Time (ms)</td><td>{fmt(lsb_metrics.get('processing_time_ms'))}</td><td>{fmt(dct_metrics.get('processing_time_ms'))}</td></tr>
    """

    # Robustness table rows
    robustness_rows = ""
    for result in robustness_results:
        qf = result.get("quality_factor", "")
        context = result.get("context", "")
        lsb_r = result.get("lsb", {})
        dct_r = result.get("dct", {})
        robustness_rows += f"""
        <tr>
            <td>{qf}</td>
            <td>{context}</td>
            <td>{fmt(lsb_r.get('ber', 1.0))}</td>
            <td>{fmt(lsb_r.get('post_compression_psnr', 0.0))}</td>
            <td>{lsb_r.get('recovery_status', 'FAILED')}</td>
            <td>{fmt(dct_r.get('ber', 1.0))}</td>
            <td>{fmt(dct_r.get('post_compression_psnr', 0.0))}</td>
            <td>{dct_r.get('recovery_status', 'FAILED')}</td>
        </tr>
        """

    # Conclusion
    rq4 = verdict.get("rq4_answer", "No conclusion available.")

    if token_match is None:
        token_status = "⚠️ NOT VERIFIED — Upload the stego image and run verification"
    elif token_match:
        token_status = "✅ MATCH — Token successfully verified"
    else:
        token_status = "❌ MISMATCH — Token verification failed"

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
    @page {{ size: A4; margin: 2cm; }}
    body {{ font-family: 'DejaVu Sans', sans-serif; font-size: 11pt; color: #1a1a1a; }}
    h1 {{ font-size: 18pt; color: #1e3a5f; text-align: center; margin-bottom: 4pt; }}
    h2 {{ font-size: 14pt; color: #1e3a5f; border-bottom: 2px solid #3b82f6; padding-bottom: 4pt; margin-top: 24pt; }}
    h3 {{ font-size: 12pt; color: #374151; margin-top: 16pt; }}
    .cover {{ text-align: center; padding-top: 120pt; }}
    .cover h1 {{ font-size: 22pt; margin-bottom: 12pt; }}
    .cover .subtitle {{ font-size: 12pt; color: #6b7280; margin-bottom: 24pt; }}
    .cover .meta {{ font-size: 10pt; color: #9ca3af; }}
    table {{ width: 100%; border-collapse: collapse; margin: 12pt 0; font-size: 10pt; }}
    th, td {{ border: 1px solid #d1d5db; padding: 6pt 8pt; text-align: left; }}
    th {{ background-color: #f3f4f6; font-weight: bold; }}
    .image-grid {{ display: flex; gap: 8pt; margin: 12pt 0; }}
    .image-grid img {{ max-width: 30%; height: auto; }}
    .heatmap-grid {{ display: flex; gap: 8pt; margin: 12pt 0; }}
    .heatmap-grid img {{ max-width: 45%; height: auto; }}
    .conclusion {{ background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12pt; margin: 12pt 0; }}
    .token-status {{ font-weight: bold; font-size: 12pt; text-align: center; padding: 8pt; }}
    .token-match {{ color: #059669; }}
    .token-mismatch {{ color: #dc2626; }}
    .page-break {{ page-break-before: always; }}
    .footer {{ text-align: center; font-size: 8pt; color: #9ca3af; margin-top: 24pt; }}
</style>
</head>
<body>

<!-- Cover Page -->
<div class="cover">
    <h1>StegoAuth Comparator</h1>
    <div class="subtitle">A Web-Based Comparative Tool for Spatial-Domain (LSB) and Frequency-Domain (DCT) Steganography in Digital Media Authentication</div>
    <p class="meta">Department of Cyber Security Science<br>Federal University of Technology, Minna<br>Niger State, Nigeria</p>
    <p class="meta">Generated: {now}</p>
</div>

<div class="page-break"></div>

<!-- Section 1: Images -->
<h2>Section 1: Images</h2>
<div class="image-grid">
    <div>
        <h3>Original</h3>
        <img src="data:image/png;base64,{original_b64}" alt="Original">
    </div>
    <div>
        <h3>LSB Stego</h3>
        <img src="data:image/png;base64,{lsb_stego_b64}" alt="LSB Stego">
    </div>
    <div>
        <h3>DCT Stego</h3>
        <img src="data:image/png;base64,{dct_stego_b64}" alt="DCT Stego">
    </div>
</div>

<!-- Section 2: Quality Metrics -->
<h2>Section 2: Quality Metrics</h2>
<table>
    <tr><th>Metric</th><th>LSB</th><th>DCT</th></tr>
    {metrics_rows}
</table>

<!-- Section 3: Heatmaps -->
<h2>Section 3: Pixel Difference Heatmaps</h2>
<div class="heatmap-grid">
    <div>
        <h3>LSB Difference Map</h3>
        <img src="data:image/png;base64,{lsb_heatmap_b64}" alt="LSB Heatmap">
    </div>
    <div>
        <h3>DCT Difference Map</h3>
        <img src="data:image/png;base64,{dct_heatmap_b64}" alt="DCT Heatmap">
    </div>
</div>

<!-- Section 4: Robustness Results -->
<h2>Section 4: Robustness Results</h2>
<table>
    <tr>
        <th>QF</th><th>Context</th>
        <th>LSB BER</th><th>LSB PSNR</th><th>LSB Status</th>
        <th>DCT BER</th><th>DCT PSNR</th><th>DCT Status</th>
    </tr>
    {robustness_rows}
</table>

<!-- Section 5: Authentication Verification -->
<h2>Section 5: Authentication Verification</h2>
<table>
    <tr><th>Field</th><th>Value</th></tr>
    <tr><td>Original Token</td><td>{original_token}</td></tr>
    <tr><td>Extracted Token</td><td>{extracted_token}</td></tr>
    <tr><td>Match Status</td><td>{token_status}</td></tr>
</table>

<!-- Section 6: Conclusion -->
<h2>Section 6: Conclusion</h2>
<div class="conclusion">
    <p>{rq4}</p>
</div>

<div class="footer">
    StegoAuth Comparator — Department of Cyber Security Science, FUT Minna — {now}
</div>

</body>
</html>"""


def generate_pdf_report(data: dict) -> bytes:
    """Generate a PDF analysis report using WeasyPrint.

    Args:
        data: Session data dictionary containing:
            - original_b64, lsb_stego_b64, dct_stego_b64 (base64 images)
            - lsb_heatmap_b64, dct_heatmap_b64 (base64 heatmaps)
            - lsb_metrics, dct_metrics (dicts with MSE, PSNR, SSIM, etc.)
            - robustness_results (list of quality factor results)
            - verdict (dict with recommendation)
            - original_token, extracted_token (strings)
            - token_match (bool)

    Returns:
        PDF file as bytes.

    Raises:
        RuntimeError: If WeasyPrint is not installed.
    """
    if not _weasyprint_available:
        raise RuntimeError(
            "WeasyPrint is not installed. Install it with: pip install weasyprint"
        )
    from weasyprint import HTML

    html_content = _build_html_report(data)
    pdf_bytes = HTML(string=html_content).write_pdf()
    return pdf_bytes
