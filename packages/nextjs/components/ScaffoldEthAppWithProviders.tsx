"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";
import { Footer } from "~~/components/Footer";
import { Header } from "~~/components/Header";
import { privyConfig } from "~~/services/web3/privyConfig";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";

// Rutas de onboarding (landing, login, selector de rol, conexión de wallet)
// que usan su propia tarjeta a pantalla completa (MichiShell) y no esperan
// el nav/footer por defecto de Scaffold-ETH arriba/abajo.
const CHROMELESS_ROUTES = ["/", "/login", "/registro", "/conectar", "/aviso"];

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isChromeless = CHROMELESS_ROUTES.includes(pathname);

  if (isChromeless) {
    return (
      <>
        {children}
        <Toaster />
      </>
    );
  }

  return (
    <>
      <div className={`flex flex-col min-h-screen `}>
        <Header />
        <main className="relative flex flex-col flex-1">{children}</main>
        <Footer />
      </div>
      <Toaster />
    </>
  );
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export const ScaffoldEthAppWithProviders = ({ children }: { children: React.ReactNode }) => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const resolvedPrivyConfig = useMemo(
    () => ({
      ...privyConfig,
      appearance: {
        ...privyConfig.appearance,
        theme: (mounted && isDarkMode ? "dark" : "light") as "dark" | "light",
      },
    }),
    [mounted, isDarkMode],
  );

  return (
    <PrivyProvider appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? ""} config={resolvedPrivyConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <ProgressBar height="3px" color="#2299dd" />
          <ScaffoldEthApp>{children}</ScaffoldEthApp>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
};
