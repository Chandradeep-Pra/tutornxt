"use client";

import { TUTOR_NAME } from "@/lib/brand";
import { SessionSnapshot } from "@/lib/types";

interface HeroPanelProps {
  session: SessionSnapshot;
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  onCopyTranscript: () => void;
}

const phaseLabel = {
  INTRO: "Introduction",
  PLACEMENT: "Placement test",
  REPORT: "Assessment report",
  PATH: "Learning path",
  LESSON: "Lesson",
} as const;

function voiceLabel(isListening: boolean, isSpeaking: boolean) {
  if (isSpeaking) {
    return `${TUTOR_NAME} is speaking`;
  }

  if (isListening) {
    return "Listening to you";
  }

  return "Waiting for next turn";
}

export function HeroPanel({
  session,
  isListening,
  isSpeaking,
  transcript,
  onCopyTranscript,
}: HeroPanelProps) {
  return (
    <aside className="glass-card h-full overflow-auto rounded-[32px] p-5 sm:p-6">
      <div className="grid gap-4">
        <div className="rounded-[28px] bg-gradient-to-br from-leaf to-moss p-5 text-white shadow-[0_18px_35px_rgba(88,204,2,0.22)]">
          <div className="flex items-start gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-white/20 text-3xl">
              <span role="img" aria-label="parrot">
                🦜
              </span>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/80">{TUTOR_NAME} your coach</p>
              <h2 className="mt-2 font-display text-4xl leading-none tracking-[-0.05em]">
                {session.profile.name ? `Hi, ${session.profile.name}` : "Ready to begin"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/85">
                Short voice turns, clear corrections, and a lesson path built from your speaking.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-white/80 bg-white/90 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700/60">Now</p>
          <p className="mt-2 text-lg font-semibold text-ink">{phaseLabel[session.phase]}</p>
          <p className="mt-2 text-sm text-emerald-900/65">{voiceLabel(isListening, isSpeaking)}</p>
        </div>

        {session.phase === "PLACEMENT" ? (
          <div className="rounded-[24px] border border-white/80 bg-white/90 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700/60">Progress</p>
            <p className="mt-2 text-lg font-semibold text-ink">
              Question {session.placementProgress.current} of {session.placementProgress.total}
            </p>
            <p className="mt-2 text-sm text-emerald-900/65">Answer naturally. Final transcript is sent after you stop speaking.</p>
          </div>
        ) : null}

        {session.profile.level ? (
          <div className="rounded-[24px] border border-white/80 bg-white/90 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700/60">Level</p>
            <p className="mt-2 text-lg font-semibold text-ink">{session.profile.level}</p>
          </div>
        ) : null}

        {session.lessonBundle ? (
          <div className="grid gap-4 rounded-[24px] border border-white/80 bg-white/90 p-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700/60">Current topic</p>
              <p className="mt-2 text-xl font-semibold text-ink">{session.lessonBundle.topicTitle}</p>
              <p className="mt-2 text-sm leading-6 text-emerald-900/65">{session.lessonBundle.coachGoal}</p>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700/60">Practice set</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-emerald-900/70">
                {session.lessonBundle.practicePrompts.map((prompt) => (
                  <li key={prompt} className="flex gap-2">
                    <span className="mt-2 h-2 w-2 rounded-full bg-leaf" />
                    <span>{prompt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        {session.phase === "LESSON" && session.lessonBundle && session.lessonQueue?.length ? (
          <div className="rounded-[24px] border border-white/80 bg-white/95 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700/60">Lesson questions</p>
            <div className="mt-3 space-y-3 text-sm leading-6 text-emerald-900/70">
              {session.lessonQueue.map((question) => (
                <div key={question.id} className="rounded-[18px] border border-emerald-900/10 bg-white/90 px-3 py-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-900/50">{question.label}</p>
                  <p className="mt-1 text-[14px] font-semibold text-ink">{question.text}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 rounded-[24px] border border-white/80 bg-white/90 p-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700/60">Conversation</p>
            <p className="mt-2 text-sm leading-6 text-emerald-900/65">
              Open or copy the transcript if you want to share the full tutor exchange.
            </p>
          </div>

          <button
            className="inline-flex min-h-11 items-center justify-center rounded-[18px] bg-gradient-to-b from-leaf to-moss px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(88,204,2,0.2)] transition hover:translate-y-[-1px]"
            type="button"
            onClick={onCopyTranscript}
          >
            Copy conversation
          </button>

          <details className="rounded-[18px] border border-emerald-900/10 bg-[#faffec] p-3">
            <summary className="cursor-pointer text-sm font-semibold text-ink">Show transcript</summary>
            <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs leading-6 text-emerald-950/75">
              {transcript}
            </pre>
          </details>
        </div>
      </div>
    </aside>
  );
}
