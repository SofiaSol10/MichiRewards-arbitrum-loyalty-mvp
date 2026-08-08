import { Cat } from "lucide-react";

export function MichiBrand({ subtitle = "Convierte cada compra en una recompensa." }: { subtitle?: string }) {
  return (
    <div className="text-center">
      <span
        aria-hidden="true"
        className="inline-grid size-14 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-content shadow-lg"
      >
        <Cat className="size-7" />
      </span>
      <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Michi Rewards</h1>
      <p className="mt-2 text-sm text-base-content/70">{subtitle}</p>
    </div>
  );
}

export function MichiShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-base-200 px-4 py-10">
      <div className="card w-full max-w-md border border-base-300 bg-base-100 p-6 shadow-xl sm:p-8">{children}</div>
    </main>
  );
}
