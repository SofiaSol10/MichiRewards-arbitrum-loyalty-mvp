import { NetworkOptions } from "./NetworkOptions";
import { usePrivy } from "@privy-io/react-auth";
import { ArrowLeftEndOnRectangleIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

export const WrongNetworkDropdown = () => {
  // Privy no soporta desconectar wallets vía `useDisconnect` de wagmi — hay
  // que cerrar la sesión con `logout()` de Privy (ver docs.privy.io/wallets/
  // connectors/ethereum/integrations/wagmi → "Using wagmi hooks").
  const { logout } = usePrivy();

  return (
    <div className="dropdown dropdown-end mr-2">
      <label tabIndex={0} className="btn btn-error btn-sm dropdown-toggle gap-1">
        <span>Wrong network</span>
        <ChevronDownIcon className="h-6 w-4 ml-2 sm:ml-0" />
      </label>
      <ul tabIndex={0} className="dropdown-content menu p-2 mt-1 shadow-lg bg-base-200 gap-1">
        <NetworkOptions />
        <li>
          <button className="menu-item text-error btn-sm flex gap-3 py-3" type="button" onClick={() => logout()}>
            <ArrowLeftEndOnRectangleIcon className="h-6 w-4 ml-2 sm:ml-0" />
            <span>Disconnect</span>
          </button>
        </li>
      </ul>
    </div>
  );
};
