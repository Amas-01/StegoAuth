"use client"

interface ThreeColumnViewProps {
  originalB64: string
  lsbB64: string
  dctB64: string
  lsbPsnr: number
  dctPsnr: number
}

export default function ThreeColumnView({
  originalB64,
  lsbB64,
  dctB64,
  lsbPsnr,
  dctPsnr,
}: ThreeColumnViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white rounded-lg border border-slate-200 p-3">
        <p className="text-sm font-medium text-slate-700 mb-2 text-center">
          Original Cover Image
        </p>
        <img
          src={`data:image/png;base64,${originalB64}`}
          alt="Original"
          className="w-full rounded border border-slate-100"
        />
      </div>
      <div className="bg-white rounded-lg border border-blue-200 p-3">
        <p className="text-sm font-medium text-slate-700 mb-2 text-center">
          LSB Stego Image
        </p>
        <img
          src={`data:image/png;base64,${lsbB64}`}
          alt="LSB Stego"
          className="w-full rounded border border-slate-100"
        />
        <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
          PSNR: {lsbPsnr.toFixed(2)} dB
        </span>
      </div>
      <div className="bg-white rounded-lg border border-orange-200 p-3">
        <p className="text-sm font-medium text-slate-700 mb-2 text-center">
          DCT Stego Image
        </p>
        <img
          src={`data:image/png;base64,${dctB64}`}
          alt="DCT Stego"
          className="w-full rounded border border-slate-100"
        />
        <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-orange-50 text-orange-700 rounded-full">
          PSNR: {dctPsnr.toFixed(2)} dB
        </span>
      </div>
    </div>
  )
}
