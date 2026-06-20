import { X } from "lucide-react"

interface ImagePreviewProps {
  file: File
  label?: string
  onClear?: () => void
}

export default function ImagePreview({
  file,
  label,
  onClear,
}: ImagePreviewProps) {
  const url = URL.createObjectURL(file)

  return (
    <div className="relative">
      {label && (
        <p className="text-sm font-medium text-slate-700 mb-2">{label}</p>
      )}
      <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
        <img
          src={url}
          alt={file.name}
          className="w-full h-48 object-contain"
        />
        {onClear && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClear()
              URL.revokeObjectURL(url)
            }}
            className="absolute top-2 right-2 p-1 bg-white/80 rounded-full hover:bg-white shadow-sm"
          >
            <X className="w-4 h-4 text-slate-600" />
          </button>
        )}
      </div>
      <p className="text-xs text-slate-400 mt-1 truncate">
        {file.name} ({(file.size / 1024).toFixed(1)} KB)
      </p>
    </div>
  )
}
