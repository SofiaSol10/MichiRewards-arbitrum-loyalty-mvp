import Link from "next/link";
import { Gem } from "lucide-react";
import type { NextPage } from "next";
import { ArrowRightEndOnRectangleIcon, UserPlusIcon } from "@heroicons/react/24/outline";
import { MichiBrand, MichiShell } from "~~/components/MichiBrand";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Michi Rewards — Iniciar Sesión",
  description: "Ingresa o regístrate en Michi Rewards para empezar a acumular y canjear MichiPoints.",
});

const Login: NextPage = () => {
  return (
    <MichiShell>
      <MichiBrand />

      <section aria-labelledby="acceso-title" className="mt-6 rounded-xl bg-base-200 p-4 sm:p-5">
        <h2 id="acceso-title" className="sr-only">
          Iniciar sesión o registrarse
        </h2>
        <div className="space-y-3">
          <Link href="/conectar" className="btn btn-primary min-h-11 w-full gap-2">
            <ArrowRightEndOnRectangleIcon className="size-4" aria-hidden="true" />
            Iniciar Sesión
          </Link>
          <Link href="/registro" className="btn btn-outline btn-primary min-h-11 w-full gap-2">
            <UserPlusIcon className="size-4" aria-hidden="true" />
            Registrarse
          </Link>
        </div>
      </section>

      <p className="mt-6 flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-base-content/40">
        <Gem className="size-3.5" aria-hidden="true" />
        Powered by Arbitrum
      </p>
    </MichiShell>
  );
};

export default Login;
