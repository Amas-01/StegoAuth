import axios from "axios"
import type {
  EmbedResponse,
  ExtractResponse,
  CompareResponse,
  RobustnessResponse,
  AuthRecordResponse,
  AuthRecordsListResponse,
  AuthLookupResponse,
} from "@/lib/types"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1"

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 second default timeout
  headers: {
    "Content-Type": "multipart/form-data",
  },
})

export async function embedLsb(
  image: File,
  token: string
): Promise<EmbedResponse> {
  const form = new FormData()
  form.append("image", image)
  form.append("token", token)
  const { data } = await api.post<EmbedResponse>("/embed/lsb", form)
  return data
}

export async function embedDct(
  image: File,
  token: string
): Promise<EmbedResponse> {
  const form = new FormData()
  form.append("image", image)
  form.append("token", token)
  const { data } = await api.post<EmbedResponse>("/embed/dct", form)
  return data
}

export async function extractLsb(
  stegoImage: File
): Promise<ExtractResponse> {
  const form = new FormData()
  form.append("stego_image", stegoImage)
  const { data } = await api.post<ExtractResponse>("/extract/lsb", form)
  return data
}

export async function extractDct(
  stegoImage: File
): Promise<ExtractResponse> {
  const form = new FormData()
  form.append("stego_image", stegoImage)
  const { data } = await api.post<ExtractResponse>("/extract/dct", form)
  return data
}

export async function compareTechniques(
  image: File,
  token: string
): Promise<CompareResponse> {
  const form = new FormData()
  form.append("image", image)
  form.append("token", token)
  // 90 second timeout — DCT + LSB dual processing takes 15–45s
  const { data } = await api.post<CompareResponse>("/compare", form, {
    timeout: 90000,
  })
  return data
}

export async function runRobustnessTest(
  image: File,
  token: string,
  qualityFactors: string = "90,75,60,50,30"
): Promise<RobustnessResponse> {
  const form = new FormData()
  form.append("image", image)
  form.append("token", token)
  form.append("quality_factors", qualityFactors)
  // 120 second timeout — loops through 5 quality levels × 2 techniques
  const { data } = await api.post<RobustnessResponse>("/robustness", form, {
    timeout: 120000,
  })
  return data
}

export async function generateReport(
  reportData: Record<string, unknown>
): Promise<Blob> {
  const { data } = await api.post("/report/generate", reportData, {
    responseType: "blob",
    headers: { "Content-Type": "application/json" },
  })
  return data
}

export async function saveAuthRecord(
  sessionId: string,
  imageHash: string,
  originalFilename: string
): Promise<AuthRecordResponse> {
  const { data } = await api.post("/auth/record", {
    session_id: sessionId,
    image_hash: imageHash,
    original_filename: originalFilename,
  })
  return data
}

export async function getAuthRecords(
  sessionId: string
): Promise<AuthRecordsListResponse> {
  const { data } = await api.post("/auth/records", {
    session_id: sessionId,
  })
  return data
}

export async function lookupAuthRecord(
  imageHash: string
): Promise<AuthLookupResponse> {
  const { data } = await api.post("/auth/lookup", {
    image_hash: imageHash,
  })
  return data
}

export async function healthCheck(): Promise<{
  status: string
  version: string
  environment: string
}> {
  const { data } = await api.get("/health")
  return data
}

// Named convenience exports for heavy endpoints with explicit timeout docs
export const compareApi = (formData: FormData) =>
  api.post("/compare", formData, { timeout: 90000 })

export const robustnessApi = (formData: FormData) =>
  api.post("/robustness", formData, { timeout: 120000 })

export default api
