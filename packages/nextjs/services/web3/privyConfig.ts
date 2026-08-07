import type { PrivyClientConfig } from "@privy-io/react-auth";
import { enabledChains } from "~~/services/web3/wagmiConfig";

/**
 * Login por correo (código OTP, sin contraseña) con wallet embebida
 * automática, más la opción de conectar una wallet externa (owner/admin del
 * contrato, usuarios avanzados).
 */
export const privyConfig: PrivyClientConfig = {
  loginMethods: ["email", "wallet"],
  // Sin esto, la wallet embebida arranca en el chain default del SDK de
  // Privy en vez de la red objetivo del dApp, y el header la marca como
  // "Wrong network" apenas el usuario se loguea.
  supportedChains: [...enabledChains],
  defaultChain: enabledChains[0],
  embeddedWallets: {
    ethereum: {
      createOnLogin: "users-without-wallets",
    },
  },
  appearance: {
    theme: "light",
    accentColor: "#f2662d",
    logo: undefined,
  },
};
