"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Address } from "@scaffold-ui/components";
import { Cat, Ticket } from "lucide-react";
import { useAccount } from "wagmi";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";

const NAV_LINKS = [
  { href: "/consumidor", label: "Michi Home" },
  { href: "/consumidor/beneficios", label: "Michi Beneficios" },
];

export function ConsumerHeader() {
  const pathname = usePathname();
  const { address } = useAccount();
  const { targetNetwork } = useTargetNetwork();

  return (
    <header className="border-b border-base-300 bg-base-100">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <Link href="/consumidor" className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-content">
            <Cat className="size-5" />
          </span>
          <p className="text-base font-bold leading-tight">Michi Rewards</p>
        </Link>

        <nav className="flex items-center gap-1 rounded-xl bg-base-200 p-1">
          {NAV_LINKS.map(link => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`btn btn-sm ${isActive ? "btn-neutral" : "btn-ghost text-base-content/60"}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {/*<span className="badge badge-outline badge-sm hidden sm:inline-flex">{targetNetwork.name}</span>*/}
          <Link
            href="/consumidor/tickets"
            aria-label="Mis Tickets y Canjes"
            className={`btn btn-sm btn-square ${pathname === "/consumidor/tickets" ? "btn-neutral" : "btn-ghost"}`}
          >
            <Ticket className="size-4" />
          </Link>
          <div className="flex items-center gap-2 rounded-xl border border-base-300 bg-base-200 px-3 py-1.5">
            <span className="text-xs font-semibold text-base-content/70">Consumidor</span>
            {address && <Address address={address} chain={targetNetwork} disableAddressLink size="sm" />}
          </div>
        </div>
      </div>
    </header>
  );
}
