# 🏆 Arbitrum Loyalty MVP - Hackathon Edition

Plataforma descentralizada de fidelización y recompensas (Loyalty & Rewards) construida en **Arbitrum** utilizando el stack de **Scaffold-ETH 2**.

---

## 📌 Requisitos y Versiones del Sistema

Para garantizar la compatibilidad y evitar problemas durante la instalación o ejecución en la hackatón, asegúrate de utilizar las siguientes versiones especificadas en la configuración del proyecto:

| Herramienta / Tecnología | Versión Requerida / Especificada | Descripción |
| :--- | :--- | :--- |
| **Node.js** | `>= 22.10.0` (o `>= 20.18.3`) | Entorno de ejecución de JavaScript |
| **Gestor de Paquetes** | `Yarn 4.13.0` (Berry) | Gestor de dependencias configurado en el monorepo |
| **Solidity** | `0.8.30` | Compilador de Smart Contracts (`solc`) |
| **Hardhat** | `^3.4.5` | Framework para desarrollo, compilación y pruebas de Smart Contracts |
| **OpenZeppelin Contracts** | `^5.0.2` | Librería de contratos inteligentes seguros (ERC20, ERC721, AccessControl, etc.) |
| **Next.js** | `~16.2.4` | Framework de React para el Frontend de la dApp |
| **React** | `~19.2.5` | Biblioteca de UI |
| **TypeScript** | `^5.8.2` | Superset tipado de JavaScript |
| **Wagmi** | `2.19.5` | React Hooks para interacción con Ethereum/EVM |
| **Viem** | `2.53.1` | Cliente ligero e interactivo de Ethereum |
| **RainbowKit** | `2.2.11` | Conexión de wallets Web3 (MetaMask, WalletConnect, etc.) |
| **Tailwind CSS** | `4.2.4` | Framework CSS para la interfaz |
| **DaisyUI** | `5.5.19` | Componentes visuales y temas UI |
| **Redes Soportadas** | `Arbitrum Sepolia`, `Arbitrum One`, `Local Hardhat` | Redes objetivo para despliegue y desarrollo |

---

## 🚀 Guía de Inicio Rápido (Quickstart)

### 1. Requisitos Previos

Asegúrate de contar con **Node.js** y **Yarn** habilitado con Corepack:

```bash
# Verificar versión de Node
node -v

# Habilitar Corepack para Yarn v4
corepack enable
```

### 2. Instalación de Dependencias

Clona el repositorio e instala las dependencias en la raíz del proyecto:

```bash
cd arbitrum-loyalty
yarn install
```

---

## 🛠️ Flujo de Trabajo y Comandos

El proyecto está organizado como un **monorepo de Yarn Workspaces**:
- `packages/hardhat`: Contratos inteligentes, scripts de despliegue y tests.
- `packages/nextjs`: Aplicación web descentralizada (dApp) con Next.js.

### 1. Iniciar la blockchain local (Hardhat Node)

En una primera terminal, ejecuta el nodo local:

```bash
yarn chain
```

### 2. Compilar y Desplegar Smart Contracts

En una segunda terminal, despliega los contratos inteligentes a tu red local:

```bash
yarn deploy
```

Si deseas desplegar directamente en **Arbitrum Sepolia**:

```bash
yarn hardhat:deploy --network arbitrumSepolia
```

### 3. Iniciar el Frontend (Next.js)

En una tercera terminal, ejecuta el servidor de desarrollo del Frontend:

```bash
yarn start
```

Abre tu navegador en [http://localhost:3000](http://localhost:3000) para interactuar con la dApp.

---

## 🧪 Pruebas y Calidad de Código

- **Ejecutar tests de Smart Contracts**:
  ```bash
  yarn test
  ```
- **Compilar contratos**:
  ```bash
  yarn compile
  ```
- **Linter y Formateo de código**:
  ```bash
  yarn lint
  yarn format
  ```

---

## 🔑 Configuración de Variables de Entorno

### Smart Contracts (`packages/hardhat/.env`)
Crea un archivo `.env` dentro de `packages/hardhat/` basado en la plantilla o define las siguientes variables:
```env
ALCHEMY_API_KEY=tu_api_key_de_alchemy
ETHERSCAN_API_KEY=tu_api_key_de_arbiscan
__RUNTIME_DEPLOYER_PRIVATE_KEY=tu_private_key_para_despliegue
```
> 💡 *Puedes generar una cuenta aleatoria localmente ejecutando `yarn generate`.*

### Frontend (`packages/nextjs/.env.local`)
Crea un archivo `.env.local` dentro de `packages/nextjs/`:
```env
NEXT_PUBLIC_ALCHEMY_API_KEY=tu_api_key_de_alchemy
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=tu_project_id_de_walletconnect
```

---

## 📂 Estructura del Proyecto

```text
arbitrum-loyalty/
├── packages/
│   ├── hardhat/               # Entorno de Smart Contracts
│   │   ├── contracts/         # Contratos en Solidity (.sol)
│   │   ├── deploy/            # Scripts de despliegue
│   │   ├── test/              # Tests unitarios
│   │   └── hardhat.config.ts  # Configuración de Hardhat y Redes (Arbitrum, etc.)
│   └── nextjs/                # Aplicación Frontend
│       ├── app/               # Páginas y rutas de Next.js (App Router)
│       ├── components/        # Componentes UI de Scaffold & Web3
│       ├── hooks/             # Custom React Hooks de Wagmi/Viem
│       └── scaffold.config.ts # Configuración de red del Frontend
├── package.json               # Configuración raíz y Yarn Workspaces
└── README.md                  # Documentación del proyecto
```

---

## 📄 Licencia

Este proyecto está distribuido bajo la licencia [MIT](LICENCE).