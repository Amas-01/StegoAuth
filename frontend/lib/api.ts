import axios from "axios"
import type {
  EmbedResponse,
  ExtractResponse,
  CompareResponse,
  RobustnessResponse,
} from "@/lib/types"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1"

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
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
  const { data } = await api.post<CompareResponse>("/compare", form)
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
  const { data } = await api.post<RobustnessResponse>("/robustness", form)
  return data
}

export async function generateReport(
  reportData: Record<string, unknown>
): Promise<Blob> {
  const { data } = await api.post("/report/generate", reportData, {
    responseType: "blob",
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

export default api
