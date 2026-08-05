import { deployScript, artifacts } from "../rocketh/deploy.js";

export default deployScript(
  async env => {
    const { deployer } = env.namedAccounts;

    const michiPoints = await env.deploy("MichiPoints", {
      account: deployer,
      artifact: artifacts.MichiPoints,
      // Sin argumentos: Ownable(msg.sender) ya usa al deployer
      args: [],
    });

    const name = await env.read(michiPoints, { functionName: "name" });
    const symbol = await env.read(michiPoints, { functionName: "symbol" });
    console.log(`🪙 Deployed: ${name} (${symbol})`);
  },
  {
    tags: ["MichiPoints"],
  },
);
