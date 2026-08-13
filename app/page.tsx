import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f4f2e9] text-[#123d36]">
      <header className="border-b border-[#d8d5ca] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#57b89d]">
              TRIZup
            </p>
            <h1 className="text-xl font-bold">TRIZ Innovation Workspace</h1>
          </div>

          <div className="flex gap-3">
            <Link
              href="/login"
              className="rounded-lg border border-[#123d36] px-5 py-2.5 text-sm font-semibold transition hover:bg-[#edf3f1]"
            >
              Log in
            </Link>

            <Link
              href="/register"
              className="rounded-lg bg-[#123d36] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Create account
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid min-h-[75vh] max-w-7xl items-center gap-16 px-8 py-16 lg:grid-cols-2">
        <div>
          <div className="mb-6 inline-flex rounded-full bg-[#dff3eb] px-4 py-2 text-sm font-semibold">
            Structured innovation powered by TRIZ
          </div>

          <h2 className="max-w-2xl text-5xl font-bold leading-tight tracking-tight">
            Turn technical problems into structured solutions.
          </h2>

          <p className="mt-6 max-w-xl text-lg leading-8 text-[#53645f]">
            Create TRIZ projects, analyse engineering systems, identify
            contradictions and discover inventive principles in one workspace.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              href="/register"
              className="rounded-lg bg-[#123d36] px-7 py-3.5 font-semibold text-white transition hover:opacity-90"
            >
              Start a new project
            </Link>

            <Link
              href="/login"
              className="rounded-lg border border-[#b9c5c1] bg-white px-7 py-3.5 font-semibold transition hover:bg-[#edf3f1]"
            >
              Open my projects
            </Link>
          </div>
        </div>

        <div className="rounded-3xl bg-[#123d36] p-8 text-white shadow-xl">
          <p className="mb-8 text-sm font-semibold uppercase tracking-[0.2em] text-[#7ed6bc]">
            TRIZ Project Flow
          </p>

          <div className="space-y-3">
            {[
              'Project Charter',
              'Engineering System',
              'S-Curve Analysis',
              'System & Supersystem Components',
              'Interaction Matrix',
              'Function Model',
              'CECA',
              'Technical Contradiction',
              'Physical Contradiction',
              'Final Solution',
            ].map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-4 rounded-xl bg-white/10 px-5 py-4"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7ed6bc] text-sm font-bold text-[#123d36]">
                  {index + 1}
                </div>
                <span className="font-medium">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-[#d8d5ca] px-8 py-6 text-center text-sm text-[#66736f]">
        TRIZ Innovation Workspace • Prototype
      </footer>
    </main>
  );
}