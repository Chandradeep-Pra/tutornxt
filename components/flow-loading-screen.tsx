interface FlowLoadingScreenProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function FlowLoadingScreen({ eyebrow, title, description }: FlowLoadingScreenProps) {
  return (
    <section className="glass-card grid h-full place-items-center rounded-[32px] p-5 sm:p-8">
      <div className="w-full max-w-2xl rounded-[28px] border border-white/80 bg-gradient-to-b from-white/95 to-[#f4ffdc]/95 p-8 text-center sm:p-12">
        <span className="inline-flex rounded-full bg-white/80 px-3 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-moss">
          {eyebrow}
        </span>
        <div className="mx-auto mt-6 flex h-20 w-20 items-center justify-center rounded-full bg-leaf/10">
          <div className="h-10 w-10 animate-pulse rounded-full bg-gradient-to-br from-leaf to-moss" />
        </div>
        <h2 className="mt-6 font-display text-[2.2rem] leading-[0.95] tracking-[-0.05em] text-ink sm:text-[3rem]">
          {title}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-7 text-emerald-900/65">{description}</p>
      </div>
    </section>
  );
}
