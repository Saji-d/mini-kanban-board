export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgb(var(--border-strong)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--border-strong)) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-accent font-display text-lg font-bold text-accent-ink">
            K
          </div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink">Mini Kanban</h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">
            Boards in motion
          </p>
        </div>
        <div className="rounded-lg border border-border-strong bg-surface p-6 shadow-2xl shadow-black/40">
          {children}
        </div>
      </div>
    </div>
  );
}
