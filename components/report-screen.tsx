import { AssessmentReport, SessionSnapshot } from "@/lib/types";
import { TUTOR_NAME } from "@/lib/brand";

interface ReportScreenProps {
  session: SessionSnapshot;
  report: AssessmentReport;
  onContinue: () => void;
  isBusy: boolean;
}

export function ReportScreen({ session, report, onContinue, isBusy }: ReportScreenProps) {
  return (
    <section className="glass-card h-full overflow-auto rounded-[32px] p-5 sm:p-8">
      <div className="grid min-h-full gap-6 rounded-[28px] border border-white/80 bg-gradient-to-b from-white/95 to-[#f4ffdc]/95 p-6 sm:p-10">
        <div>
          <span className="inline-flex rounded-full bg-white/80 px-3 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-moss">
            Assessment Report
          </span>
          <h2 className="mt-4 font-display text-[2.2rem] leading-[0.95] tracking-[-0.05em] text-ink sm:text-[3.4rem]">
            {session.profile.name ?? "Learner"}, your English level looks {report.level}.
          </h2>
          <p className="mt-4 max-w-3xl text-[15px] leading-7 text-emerald-900/65">{report.summary}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[24px] border border-leaf/10 bg-white/90 p-5">
            <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700/60">
              Current level
            </span>
            <p className="mt-3 font-display text-5xl tracking-[-0.05em] text-ink sm:text-6xl">{report.level}</p>
            <p className="mt-3 text-[15px] leading-7 text-emerald-900/65">
              This estimate is based on sentence length, vocabulary variety, and how comfortably you handled routine, past, and future ideas.
            </p>
          </div>

          <div className="rounded-[24px] border border-leaf/10 bg-white/90 p-5">
            <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700/60">
              What happens next
            </span>
            <p className="mt-3 text-[15px] leading-7 text-emerald-900/65">
              Next, {TUTOR_NAME} turns this assessment into a learning path with speaking topics to cover, so each lesson has a clear goal and practice set.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[24px] border border-leaf/10 bg-white/90 p-5">
            <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700/60">
              Strengths
            </span>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-7 text-emerald-900/65">
              {report.strengths.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-[24px] border border-leaf/10 bg-white/90 p-5">
            <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700/60">
              Focus areas
            </span>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-7 text-emerald-900/65">
              {report.focusAreas.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="inline-flex min-h-14 items-center justify-center rounded-[20px] bg-gradient-to-b from-leaf to-moss px-5 font-bold text-white shadow-[0_18px_30px_rgba(88,204,2,0.24)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            onClick={onContinue}
            disabled={isBusy}
          >
            View learning path
          </button>
        </div>
      </div>
    </section>
  );
}
