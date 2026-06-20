import type { VerdictSchema } from "@/lib/types"

interface VerdictPanelProps {
  verdict: VerdictSchema
}

export default function VerdictPanel({ verdict }: VerdictPanelProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">
        Research Question Answers
      </h2>
      <div className="space-y-4">
        {/* RQ1 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">
            RQ1 — Imperceptibility
          </p>
          <p className="text-sm text-slate-700">{verdict.rq1_answer}</p>
        </div>

        {/* RQ3 */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-1">
            RQ3 — Embedding Capacity
          </p>
          <p className="text-sm text-slate-700">{verdict.rq3_answer}</p>
        </div>

        {/* RQ4 */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-xs font-medium text-purple-600 uppercase tracking-wider mb-1">
            RQ4 — Recommended Technique
          </p>
          <p className="text-sm text-slate-700">{verdict.rq4_answer}</p>
        </div>

        {/* Note about RQ2 */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-xs font-medium text-amber-600 uppercase tracking-wider mb-1">
            RQ2 — Robustness
          </p>
          <p className="text-sm text-slate-600">
            Visit the{" "}
            <a
              href="/robustness"
              className="text-blue-600 hover:underline font-medium"
            >
              Robustness Lab
            </a>{" "}
            to view BER results under compression to confirm RQ2.
          </p>
        </div>
      </div>
    </div>
  )
}
