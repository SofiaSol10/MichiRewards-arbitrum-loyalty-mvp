import Link from "next/link";
import type { NextPage } from "next";
import { BuildingStorefrontIcon, UserIcon } from "@heroicons/react/24/outline";
import { MichiBrand, MichiShell } from "~~/components/MichiBrand";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Michi Rewards — Elige tu rol",
  description: "Entra a Michi Rewards como comerciante o consumidor y convierte cada compra en MichiPoints.",
});

const Home: NextPage = () => {
  return (
    <MichiShell>
      <MichiBrand />

      <section aria-labelledby="rol-title" className="mt-6 rounded-xl bg-base-200 p-4 sm:p-5">
        <h2 id="rol-title" className="text-sm font-semibold">
          ¿Qué rol te pertenece?
        </h2>
        <div className="mt-3 space-y-3">
          <Link href="/conectar?rol=comerciante" className="btn btn-primary min-h-11 w-full gap-2">
            <BuildingStorefrontIcon className="size-4" aria-hidden="true" />
            Comerciante
          </Link>
          <Link href="/conectar?rol=consumidor" className="btn btn-outline btn-primary min-h-11 w-full gap-2">
            <UserIcon className="size-4" aria-hidden="true" />
            Consumidor
          </Link>
        </div>
      </section>
    </MichiShell>
  );
};

export default Home;
