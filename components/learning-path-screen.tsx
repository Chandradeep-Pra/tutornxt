import { LearningPathTopic, SessionSnapshot } from "@/lib/types";
import { TUTOR_NAME } from "@/lib/brand";

interface LearningPathScreenProps {
  session: SessionSnapshot;
  topics: LearningPathTopic[];
  onSelectTopic: (topicId: string) => void;
  isBusy: boolean;
}

export function LearningPathScreen({
  session,
  topics,
  onSelectTopic,
  isBusy,
}: LearningPathScreenProps) {
  return (
    <section className="glass-card h-full overflow-auto rounded-[32px] p-5 sm:p-8">
      <div className="grid min-h-full gap-6 rounded-[28px] border border-white/80 bg-gradient-to-b from-white/95 to-[#f4ffdc]/95 p-6 sm:p-10">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full bg-white/80 px-3 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-moss">
            Learning path
          </span>
          <h2 className="mt-4 font-display text-[2.2rem] leading-[0.95] tracking-[-0.05em] text-ink sm:text-[3.2rem]">
            {session.profile.name ?? "Learner"}, here is what {TUTOR_NAME} wants to train next.
          </h2>
          <p className="mt-4 text-[15px] leading-7 text-emerald-900/65">
            Each topic opens a voice lesson with AI-generated coaching steps and practice prompts. Choose the topic you want to work on first.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {topics.map((topic, index) => (
            <button
              key={topic.id}
              type="button"
              onClick={() => onSelectTopic(topic.id)}
              disabled={isBusy}
              className="group rounded-[28px] border border-leaf/10 bg-white/90 p-5 text-left transition hover:-translate-y-1 hover:border-leaf/25 hover:shadow-bubble disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-leaf/10 text-sm font-black text-moss">
                  0{index + 1}
                </span>
                <span className="rounded-full bg-yolk/40 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-900/70">
                  Voice lesson
                </span>
              </div>
              <h3 className="mt-4 font-display text-3xl leading-none tracking-[-0.04em] text-ink">
                {topic.title}
              </h3>
              <p className="mt-3 text-[15px] leading-7 text-emerald-900/65">{topic.reason}</p>
              <ul className="mt-4 space-y-2">
                {topic.outcomes.map((outcome) => (
                  <li key={outcome} className="flex items-center gap-3 text-sm text-emerald-900/70">
                    <span className="h-2.5 w-2.5 rounded-full bg-leaf" />
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex items-center justify-between">
                <span className="text-sm font-bold text-moss">Generate lesson + practice</span>
                <span className="text-lg text-moss transition group-hover:translate-x-1">{">"}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
