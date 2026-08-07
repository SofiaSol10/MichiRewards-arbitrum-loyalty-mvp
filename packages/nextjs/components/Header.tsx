"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { hardhat } from "viem/chains";
import { Bars3Icon, BugAntIcon, Cog6ToothIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick, useTargetNetwork } from "~~/hooks/scaffold-eth";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
  localOnly?: boolean; // solo visible en red local (Hardhat)
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "Michi Rewards",
    href: "/",
    icon: <SparklesIcon className="h-4 w-4" />,
  },
  {
    label: "Admin",
    href: "/admin",
    icon: <Cog6ToothIcon className="h-4 w-4" />,
  },
  {
    label: "Debug Contracts",
    href: "/debug",
    icon: <BugAntIcon className="h-4 w-4" />,
    localOnly: true,
  },
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  return (
    <>
      {menuLinks
        .filter(link => !link.localOnly || isLocalNetwork)
        .map(({ label, href, icon }) => {
          const isActive = pathname === href;
          return (
            <li key={href} className="h-full">
              <Link
                href={href}
                passHref
                className={`${isActive ? "bg-base-300" : ""
                  } hover:bg-base-300 focus:!bg-base-300 h-full px-4 text-sm gap-2 flex items-center whitespace-nowrap`}
              >
                {icon}
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
    </>
  );
};

// Rutas que ya tienen su propio header (ConsumerHeader, MerchantHeader, etc.)
// — ahí el Header global no debe renderizarse para evitar duplicado.
const ROUTES_WITH_OWN_HEADER = ["/consumidor", "/comerciante"];

/**
 * Site header
 */
export const Header = () => {
  const pathname = usePathname();
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  const burgerMenuRef = useRef<HTMLDetailsElement>(null);
  useOutsideClick(burgerMenuRef, () => {
    burgerMenuRef?.current?.removeAttribute("open");
  });

  const hasOwnHeader = ROUTES_WITH_OWN_HEADER.some(route => pathname.startsWith(route));
  if (hasOwnHeader) return null;

  return (
    <div className="sticky lg:static top-0 navbar bg-base-100 min-h-16 shrink-0 justify-between z-20 border-b-2 border-base-300 p-0 sm:px-2">
      <div className="navbar-start w-auto self-stretch">
        <details className="dropdown" ref={burgerMenuRef}>
          <summary className="ml-1 btn btn-ghost lg:hidden hover:bg-transparent">
            <Bars3Icon className="h-1/2" />
          </summary>
          <ul
            className="menu menu-compact dropdown-content mt-3 p-2 shadow-lg bg-base-100 w-52"
            onClick={() => {
              burgerMenuRef?.current?.removeAttribute("open");
            }}
          >
            <HeaderMenuLinks />
          </ul>
        </details>
        <Link href="/" passHref className="hidden lg:flex items-center gap-2 ml-4 mr-6 shrink-0">
          <div className="flex relative w-10 h-10">
            <Image alt="Michi Rewards logo" className="cursor-pointer" fill src="/logo.svg" />
          </div>
          <span className="font-bold leading-tight">Michi Rewards</span>
        </Link>
        <ul className="hidden lg:flex lg:flex-nowrap h-full m-0 p-0 list-none">
          <HeaderMenuLinks />
        </ul>
      </div>
      <div className="navbar-end grow mr-4">
        <RainbowKitCustomConnectButton />
        {isLocalNetwork && <FaucetButton />}
      </div>
    </div>
  );
};
