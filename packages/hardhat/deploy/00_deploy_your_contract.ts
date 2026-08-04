import { deployScript, artifacts } from "../rocketh/deploy.js";

export default deployScript(
  async env => {
    const { deployer } = env.namedAccounts;

    const michiCoin = await env.deploy("MichiCoin", {
      account: deployer,
      artifact: artifacts.MichiCoin,
      // Sin argumentos: Ownable(msg.sender) ya usa al deployer
      args: [],
    });

    const name = await env.read(michiCoin, { functionName: "name" });
    const symbol = await env.read(michiCoin, { functionName: "symbol" });
    console.log(`🪙 Deployed: ${name} (${symbol})`);
  },
  {
    tags: ["MichiCoin"],
  },
);
