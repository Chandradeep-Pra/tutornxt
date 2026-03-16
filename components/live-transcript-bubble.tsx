interface LiveTranscriptBubbleProps {
  transcript: string;
}

export function LiveTranscriptBubble({ transcript }: LiveTranscriptBubbleProps) {
  if (!transcript.trim()) {
    return null;
  }

  return (
    <div className="flex justify-end">
      <div className="max-w-[88%] rounded-[24px] rounded-tr-md border border-dashed border-leaf/20 bg-white/70 px-4 py-4 md:max-w-[76%]">
        <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700/60">
          Live transcript
        </span>
        <p className="whitespace-pre-wrap text-[15px] italic leading-7 text-emerald-900/70">{transcript}</p>
      </div>
    </div>
  );
}
