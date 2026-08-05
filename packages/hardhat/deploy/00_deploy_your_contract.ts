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
    const owner = await env.read(michiPoints, { functionName: "owner" });
    const balance = await env.read(michiPoints, { functionName: "balanceOf", args: [deployer] });

    console.log(`🪙 Deployed: ${name} (${symbol}) at ${michiPoints.address}`);
    console.log(`👑 Owner (Account #0): ${owner}`);
    console.log(`🐱 Initial balance of Account #0: ${balance.toString()} wei (1000 MCHI)`);
  },
  {
    tags: ["MichiPoints"],
  },
);
