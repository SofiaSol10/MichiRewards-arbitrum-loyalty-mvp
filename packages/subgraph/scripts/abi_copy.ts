import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import type { Abi } from "viem";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEPLOYED_CONTRACTS_FILE = path.join(__dirname, "..", "..", "nextjs", "contracts", "deployedContracts.ts");
const GRAPH_DIR = path.join(__dirname, "..");

function publishContract(contractName: string, contractObject: { address: string; abi: Abi }, networkName: string) {
  const graphConfigPath = path.join(GRAPH_DIR, "networks.json");
  const graphConfig = fs.existsSync(graphConfigPath) ? JSON.parse(fs.readFileSync(graphConfigPath, "utf8")) : {};

  if (!graphConfig[networkName]) graphConfig[networkName] = {};
  graphConfig[networkName][contractName] = { address: contractObject.address };

  fs.writeFileSync(graphConfigPath, JSON.stringify(graphConfig, null, 2));

  const abisDir = path.join(GRAPH_DIR, "abis");
  if (!fs.existsSync(abisDir)) fs.mkdirSync(abisDir);
  fs.writeFileSync(
    path.join(abisDir, `${networkName}_${contractName}.json`),
    JSON.stringify(contractObject.abi, null, 2),
  );
}

async function main() {
  const fileContent = fs.readFileSync(DEPLOYED_CONTRACTS_FILE, "utf8");
  const match = fileContent.match(/const deployedContracts = ({[^;]+}) as const;/s);
  if (!match?.[1]) throw new Error("Failed to find deployedContracts");

  // Parse the TS object literal as JSON (add quotes around keys, remove trailing commas)
  const json = match[1].replace(/(\w+)(?=\s*:)/g, '"$1"').replace(/,(?=\s*[}\]])/g, "");
  const contracts = JSON.parse(json);
  const localContracts = contracts[31337];

  if (!localContracts) {
    console.error("No contracts for local network.");
    return;
  }

  for (const name in localContracts) {
    publishContract(name, localContracts[name], "localhost");
  }
  console.log("Published contracts to subgraph package.");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
