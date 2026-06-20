# StegoAuth Comparator

A Web-Based Comparative Tool for Spatial-Domain (LSB) and Frequency-Domain (DCT) Steganography in Digital Media Authentication.

## Project Title

"Development of a Web-Based Comparative Tool for Spatial-Domain (LSB) and Frequency-Domain (DCT) Steganography in Digital Media Authentication"

## Department

Cyber Security Science, Federal University of Technology, Minna, Niger State, Nigeria

## Overview

StegoAuth Comparator is a secure, research-grade web application that allows users to embed authentication tokens into digital images using two steganographic techniques — Least Significant Bit (LSB) and Discrete Cosine Transform (DCT) — measure the resulting image quality degradation, test robustness against JPEG compression, and export a PDF analysis report.

## Features

- **LSB Steganography**: Spatial-domain embedding with high capacity (>50 dB PSNR)
- **DCT Steganography**: Frequency-domain embedding, compression-resistant
- **Image Quality Metrics**: PSNR, MSE, SSIM computation
- **Robustness Testing**: JPEG compression at quality factors 90, 75, 60, 50, 30
- **Comparative Analysis**: Side-by-side technique comparison with automated verdicts
- **PDF Report Export**: Full analysis report with charts and metrics
- **Ephemeral Processing**: No images stored server-side

## Tech Stack

### Backend
- Python 3.11
- FastAPI 0.111.0
- OpenCV 4.9.0.80
- NumPy 1.26.4
- scikit-image 0.22.0
- WeasyPrint 61.2

### Frontend
- Next.js 14 (App Router)
- TypeScript 5.x
- Tailwind CSS 3.4.x
- shadcn/ui
- Recharts 2.12.x

## Getting Started

### Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt --default-timeout=100
uvicorn main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on http://localhost:3000 and the backend on http://localhost:8000.

## API Documentation

Once the backend is running, visit http://localhost:8000/docs for interactive API documentation.

## License

This project is for academic purposes at the Federal University of Technology, Minna.
