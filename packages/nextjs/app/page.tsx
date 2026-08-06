import Link from "next/link";
import {
  Brain,
  Cat,
  CheckCircle2,
  Coins,
  Gift,
  PawPrint,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Zap,
} from "lucide-react";
import type { NextPage } from "next";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Michi Rewards — Fidelización on-chain con IA",
  description:
    "Convierte cada compra en una recompensa universal. Acumula MichiPoints, sube de nivel a tu mascota virtual y canjea beneficios en toda una red de negocios aliados.",
});

const STEPS = [
  {
    icon: ShoppingBag,
    title: "1. Compra Local",
    description:
      "Visita cualquier comercio afiliado a la red (cafeterías, librerías, restaurantes) y realiza tu compra habitual.",
  },
  {
    icon: Coins,
    title: "2. Gana MichiPoints",
    description:
      "El comercio registra la venta on-chain. Recibes 1 MichiPoint por cada sol/dólar gastado de forma automática.",
  },
  {
    icon: Gift,
    title: "3. Canjea donde sea",
    description:
      "Usa tus puntos acumulados para reclamar beneficios en ese mismo negocio o en cualquier otro de la red.",
  },
];

const FEATURES = [
  {
    icon: Brain,
    title: "Motor de Recomendación IA",
    description:
      "Analiza el historial on-chain de consumo para recomendar ofertas hiper-personalizadas, aumentando la tasa de retorno.",
  },
  {
    icon: Zap,
    title: "Arbitrum L2",
    description:
      "Puntos registrados como activos digitales en blockchain. Comisiones de fracciones de centavo y liquidación instantánea.",
  },
  {
    icon: ShieldCheck,
    title: "Account Abstraction",
    description:
      "Ingreso solo con correo electrónico y gas sponsorizado (paymasters). El usuario final nunca paga comisiones de red.",
  },
];

const Home: NextPage = () => {
  return (
    <div className="overflow-x-hidden bg-base-100">
      <style>{`
        @keyframes michi-float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .animate-michi-float {
          animation: michi-float 4s ease-in-out infinite;
        }
      `}</style>

      {/* Navegación */}
      <nav className="fixed top-0 z-40 w-full border-b border-base-300 bg-base-100/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-content shadow-sm">
              <Cat className="size-6" aria-hidden="true" />
            </span>
            <span className="text-2xl font-bold tracking-tight text-base-content">Michi Rewards</span>
          </Link>
          <div className="hidden items-center gap-8 text-sm font-medium text-base-content/70 md:flex">
            <a href="#como-funciona" className="transition-colors hover:text-primary">
              Cómo Funciona
            </a>
            <a href="#tecnologia" className="transition-colors hover:text-primary">
              Tecnología y Beneficios
            </a>
          </div>
          <Link href="/login" className="btn btn-primary gap-2">
            Ingresar a la dApp
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="mx-auto grid min-h-[90vh] max-w-7xl grid-cols-1 items-center gap-12 px-6 pb-20 pt-32 lg:grid-cols-2">
        <div className="z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
            <Sparkles className="size-4" aria-hidden="true" />
            Proyecto ETH Arbitrum Sepolia
          </div>
          <h1 className="mb-6 text-5xl font-extrabold leading-[1.15] text-base-content md:text-6xl">
            Fidelización on-chain con IA para{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              negocios locales
            </span>
          </h1>
          <p className="mb-10 max-w-lg text-lg leading-relaxed text-base-content/70 md:text-xl">
            Convierte cada compra en una recompensa universal. Acumula MichiPoints, sube de nivel a tu mascota virtual y
            canjea beneficios hiper-personalizados en toda una red de aliados.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link href="/login" className="btn btn-primary btn-lg gap-3">
              <ShoppingBag className="size-5" aria-hidden="true" />
              Soy Consumidor
            </Link>
            <Link href="/login" className="btn btn-outline btn-primary btn-lg gap-3">
              <Store className="size-5" aria-hidden="true" />
              Soy Comerciante
            </Link>
          </div>
          <p className="mt-6 flex items-center gap-2 text-sm text-base-content/50">
            <CheckCircle2 className="size-5 text-success" aria-hidden="true" />
            Transacciones sin costo de gas (Gasless)
          </p>
        </div>

        {/* Mockup visual (decorativo, datos de ejemplo fijos) */}
        <div className="animate-michi-float relative w-full max-w-md lg:ml-auto">
          <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-r from-primary to-accent opacity-20 blur" />
          <div className="card relative border border-base-300 bg-base-100 p-7 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-full bg-base-200 text-base-content/60">
                  <PawPrint className="size-4" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold text-base-content/70">0x7099...79C8</span>
              </div>
              <span className="badge badge-success badge-sm font-bold">Arbitrum Testnet</span>
            </div>

            <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-accent p-6 text-primary-content shadow-lg">
              <p className="mb-1 text-sm font-semibold uppercase tracking-wider opacity-90">Saldo Actual</p>
              <div className="mb-2 flex items-baseline gap-2">
                <h2 className="text-5xl font-extrabold tracking-tight">2,500</h2>
                <span className="text-lg font-medium opacity-90">MP</span>
              </div>
              <p className="text-sm opacity-80">Poder Adquisitivo: S/ 25.00</p>
            </div>

            <div className="mb-6 rounded-xl border border-base-300 bg-base-200 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-base-content/50">
                Tu Michi Virtual
              </p>
              <div className="flex items-center gap-4">
                <div className="grid size-14 shrink-0 place-items-center rounded-xl border border-base-300 bg-base-100 text-2xl shadow-sm">
                  🐱
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <h3 className="font-bold text-base-content">Michi Explorador</h3>
                    <span className="badge badge-outline badge-sm font-bold">Nivel 2</span>
                  </div>
                  <progress className="progress progress-primary w-full" value={75} max={100} />
                  <p className="mt-1 text-right text-[10px] text-base-content/50">Faltan 500 MP</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="size-4 text-primary" aria-hidden="true" />
                <h4 className="text-sm font-bold text-base-content">Sugerencia IA</h4>
              </div>
              <p className="mb-3 text-xs text-base-content/60">Basado en tus consumos en &quot;Café Central&quot;</p>
              <div className="w-full rounded-lg bg-neutral py-2 text-center text-sm font-semibold text-neutral-content">
                Canjear 20% Cashback (50 MP)
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Cómo Funciona */}
      <section id="como-funciona" className="border-t border-base-300 bg-base-100 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-base-content md:text-4xl">
              Un ecosistema circular donde todos ganan
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-base-content/70">
              Acumula valor real por tus compras diarias en una sola billetera digital, sin múltiples apps ni tarjetas
              de papel que se pierden.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="p-6 text-center">
                <div className="mx-auto mb-6 grid size-20 place-items-center rounded-full bg-primary/10 text-primary shadow-sm">
                  <Icon className="size-9" aria-hidden="true" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-base-content">{title}</h3>
                <p className="text-base-content/70">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tecnología y Beneficios */}
      <section id="tecnologia" className="border-t border-base-300 bg-base-200 py-24">
        <div className="mx-auto grid max-w-7xl gap-16 px-6 md:grid-cols-2 items-center">
          <div>
            <h2 className="mb-6 text-3xl font-bold text-base-content md:text-4xl">
              Tecnología Web3 + IA invisible para el usuario
            </h2>
            <p className="mb-8 text-lg text-base-content/70">
              No necesitas saber de criptomonedas. Nosotros abstraemos toda la complejidad tecnológica para ofrecerte
              una experiencia fluida.
            </p>

            <div className="space-y-6">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex gap-4">
                  <div className="grid size-12 shrink-0 place-items-center rounded-xl border border-base-300 bg-base-100 text-primary shadow-sm">
                    <Icon className="size-6" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="mb-1 text-xl font-bold text-base-content">{title}</h4>
                    <p className="text-base-content/70">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-neutral p-8 text-neutral-content shadow-2xl">
            <div className="absolute inset-0 overflow-hidden break-all font-mono text-[8px] leading-tight text-success opacity-10">
              mapping(address =&gt; uint256) balanceOf; mapping(address =&gt; uint256) totalPointsEarned; event
              PurchaseRegistered(address user, address merchant, uint256 amount, uint256 points); function
              registerPurchase(address customer, uint256 purchaseAmount) external onlyMerchant {"{"} ... {"}"}
            </div>
            <div className="relative z-10">
              <div className="mb-8 flex items-center justify-between border-b border-neutral-content/20 pb-4">
                <span className="font-mono text-sm text-neutral-content/60">Smart Contract (Solidity)</span>
                <span className="badge badge-success badge-sm gap-1 font-normal">
                  <span className="size-2 rounded-full bg-success" /> Deployed on Testnet
                </span>
              </div>
              <h3 className="mb-4 text-2xl font-bold">Transparencia Total</h3>
              <p className="mb-6 text-neutral-content/70">
                Los MichiPoints no son una moneda volátil, son un registro inmutable de lealtad. Ninguna empresa puede
                borrar tus puntos, te pertenecen a ti on-chain.
              </p>
              <button
                type="button"
                disabled
                className="btn w-full border-neutral-content/30 bg-neutral-content/10 md:w-auto"
              >
                Ver Código en GitHub
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-base-300 bg-neutral py-12 text-neutral-content">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
          <div className="flex items-center gap-2">
            <Cat className="size-5" aria-hidden="true" />
            <span className="text-lg font-bold tracking-tight">Michi Rewards</span>
          </div>
          <p className="text-sm text-neutral-content/60">Proyecto para Hackathon ETH Arbitrum Sepolia.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
