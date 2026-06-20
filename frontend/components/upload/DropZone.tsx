"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload } from "lucide-react"

interface DropZoneProps {
  onFileSelect: (file: File) => void
  accept?: Record<string, string[]>
  maxSize?: number
  label?: string
}

export default function DropZone({
  onFileSelect,
  accept,
  maxSize = 5 * 1024 * 1024,
  label = "Drop image here or click to browse",
}: DropZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0])
      }
    },
    [onFileSelect]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: accept || {
        "image/jpeg": [".jpg", ".jpeg"],
        "image/png": [".png"],
      },
      maxSize,
      multiple: false,
    })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
        isDragActive
          ? "border-blue-400 bg-blue-50"
          : isDragReject
          ? "border-red-400 bg-red-50"
          : "border-slate-300 hover:border-blue-400 hover:bg-blue-50/50"
      }`}
    >
      <input {...getInputProps()} />
      <Upload className="w-8 h-8 mx-auto mb-3 text-slate-400" />
      <p className="text-sm text-slate-600">{label}</p>
      <p className="text-xs text-slate-400 mt-1">
        JPG or PNG only &middot; Max 5 MB
      </p>
    </div>
  )
}
