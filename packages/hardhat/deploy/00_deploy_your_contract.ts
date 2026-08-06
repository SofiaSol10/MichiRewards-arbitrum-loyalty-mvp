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

    const owner = await env.read(michiPoints, { functionName: "owner" });
    const isMerchant = await env.read(michiPoints, { functionName: "merchants", args: [deployer] });

    console.log(`🪙 Deployed: MichiPoints at ${michiPoints.address}`);
    console.log(`👑 Owner (Account #0): ${owner}`);
    console.log(`🏪 Account #0 registered as merchant: ${isMerchant}`);
  },
  {
    tags: ["MichiPoints"],
  },
);
