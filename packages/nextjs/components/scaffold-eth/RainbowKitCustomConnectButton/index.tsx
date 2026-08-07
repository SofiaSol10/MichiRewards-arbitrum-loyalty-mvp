"use client";

// @refresh reset
import { AddressInfoDropdown } from "./AddressInfoDropdown";
import { AddressQRCodeModal } from "./AddressQRCodeModal";
import { WrongNetworkDropdown } from "./WrongNetworkDropdown";
import { usePrivy } from "@privy-io/react-auth";
import { Balance } from "@scaffold-ui/components";
import { getBlockExplorerAddressLink } from "@scaffold-ui/hooks";
import { useAccount } from "wagmi";
import { useNetworkColor } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";

/**
 * Botón de conexión respaldado por Privy: dispara el login (correo + código,
 * o wallet externa) cuando no hay sesión, y muestra balance/dirección/red
 * una vez conectado (wallet embebida o externa, indistintamente).
 */
export const RainbowKitCustomConnectButton = () => {
  const networkColor = useNetworkColor();
  const { targetNetwork } = useTargetNetwork();
  const { ready, authenticated, login } = usePrivy();
  const { address, chain, isConnected } = useAccount();

  if (!ready) {
    return (
      <button className="btn btn-primary btn-sm" type="button" disabled>
        Conectando…
      </button>
    );
  }

  if (!authenticated) {
    return (
      <button className="btn btn-primary btn-sm" onClick={login} type="button">
        Conectar
      </button>
    );
  }

  // `authenticated` (sesión de Privy) puede quedar en `true` antes de que
  // wagmi termine de sincronizar la wallet (`isConnected`/`address`) — sobre
  // todo al recargar con una sesión ya iniciada. Llamar a `login()` en ese
  // estado intermedio falla ("user is already logged in"), así que se
  // muestra un estado de carga en vez de reofrecer el botón de login.
  if (!isConnected || !address) {
    return (
      <button className="btn btn-primary btn-sm" type="button" disabled>
        Conectando…
      </button>
    );
  }

  if (!chain || chain.id !== targetNetwork.id) {
    return <WrongNetworkDropdown />;
  }

  const blockExplorerAddressLink = getBlockExplorerAddressLink(targetNetwork, address);

  return (
    <>
      <div className="flex flex-col items-center mr-2">
        <Balance
          address={address}
          style={{
            minHeight: "0",
            height: "auto",
            fontSize: "0.8em",
          }}
        />
        <span className="text-xs" style={{ color: networkColor }}>
          {chain.name}
        </span>
      </div>
      <AddressInfoDropdown address={address} displayName={address} blockExplorerAddressLink={blockExplorerAddressLink} />
      <AddressQRCodeModal address={address} modalId="qrcode-modal" />
    </>
  );
};
