import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";

export type WalletStatus = "loading" | "unauthenticated" | "ready";

/**
 * Única fuente de verdad de "¿el usuario tiene sesión iniciada y su wallet
 * ya está lista?", combinando Privy (`authenticated`) y wagmi
 * (`isConnected`, sincronizado por `PrivyWagmiSync`). `/conectar` y
 * `useRequireWallet` deben usar exactamente este mismo cálculo — si cada uno
 * usa su propia condición (por ejemplo, uno mirando solo `isConnected`),
 * quedan desincronizados: `/conectar` puede decidir "ya está listo, navego"
 * un instante antes de que la página de destino esté de acuerdo, esta rebota
 * de vuelta a `/conectar`, que vuelve a ver `isConnected` true y navega de
 * nuevo — un loop de redirecciones infinito entre las dos rutas.
 */
export const useWalletStatus = (): WalletStatus => {
  const { ready, authenticated } = usePrivy();
  const { isConnected } = useAccount();

  if (!ready) return "loading";
  if (!authenticated) return "unauthenticated";
  if (!isConnected) return "loading";
  return "ready";
};
