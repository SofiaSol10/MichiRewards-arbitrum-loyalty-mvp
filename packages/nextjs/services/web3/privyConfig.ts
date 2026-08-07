import type { PrivyClientConfig } from "@privy-io/react-auth";

/**
 * Login por correo (código OTP, sin contraseña) con wallet embebida
 * automática, más la opción de conectar una wallet externa (owner/admin del
 * contrato, usuarios avanzados).
 */
export const privyConfig: PrivyClientConfig = {
  loginMethods: ["email", "wallet"],
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
