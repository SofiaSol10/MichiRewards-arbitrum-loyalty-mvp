import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { type WalletStatus, useWalletStatus } from "./useWalletStatus";

export type { WalletStatus as RequireWalletStatus };

/**
 * Protege páginas que requieren sesión iniciada. Antes, cada página
 * renderizaba su propio cartel de "Conecta tu wallet" inline, dejando ver el
 * layout completo del dashboard con solo el botón de cabecera funcional — en
 * vez de eso, esto redirige a `/conectar` (donde vive todo el flujo de login)
 * apenas `useWalletStatus` confirma que no hay sesión.
 */
export const useRequireWallet = (redirectTo = "/conectar"): WalletStatus => {
  const router = useRouter();
  const status = useWalletStatus();

  useEffect(() => {
    if (status === "unauthenticated") router.replace(redirectTo);
  }, [status, redirectTo, router]);

  return status;
};
