export interface MetricsSchema {
  mse: number
  psnr: number
  ssim: number
  capacity_bits: number
  capacity_bytes: number
  processing_time_ms: number
}

export interface EmbedResponse {
  stego_image_b64: string
  heatmap_b64: string
  technique: "LSB" | "DCT"
  metrics: MetricsSchema
  image_dimensions: [number, number]
  token_length_bits: number
  sanitised_token: string
}

export interface ExtractResponse {
  extracted_token: string
  token_length_bits: number
  technique: "LSB" | "DCT"
}

export interface VerdictSchema {
  better_imperceptibility: "LSB" | "DCT"
  better_robustness: "LSB" | "DCT"
  better_capacity: "LSB" | "DCT"
  recommended_for_authentication: "LSB" | "DCT"
  rq1_answer: string
  rq3_answer: string
  rq4_answer: string
}

export interface CompareResponse {
  original_b64: string
  lsb_stego_b64: string
  dct_stego_b64: string
  lsb_heatmap_b64: string
  dct_heatmap_b64: string
  lsb_metrics: MetricsSchema
  dct_metrics: MetricsSchema
  verdict: VerdictSchema
}

export interface RobustnessResult {
  quality_factor: number
  context: string
  lsb: {
    ber: number
    post_compression_psnr: number
    extracted_token: string
    recovery_status: "SUCCESS" | "FAILED"
  }
  dct: {
    ber: number
    post_compression_psnr: number
    extracted_token: string
    recovery_status: "SUCCESS" | "FAILED"
  }
}

export interface RobustnessResponse {
  results: RobustnessResult[]
  lsb_survival_quality_factors: number[]
  dct_survival_quality_factors: number[]
  recommendation: string
}

export type Technique = "LSB" | "DCT"

export interface ApiError {
  error: string
  message: string
  status_code: number
}
