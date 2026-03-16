export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-6">
      <section className="glass-card w-full max-w-xl rounded-[32px] p-8 text-center">
        <span className="inline-flex rounded-full bg-white/75 px-3 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-moss">
          Not found
        </span>
        <h1 className="mt-4 font-display text-[2.4rem] leading-[0.95] tracking-[-0.05em] text-ink">
          That page flew away.
        </h1>
        <p className="mt-4 text-[15px] leading-7 text-emerald-900/65">
          The page you asked for is not here, but your tutor app is still ready at the main route.
        </p>
      </section>
    </main>
  );
}
