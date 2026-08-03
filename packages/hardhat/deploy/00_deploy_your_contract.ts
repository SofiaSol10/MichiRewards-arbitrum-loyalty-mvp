import { deployScript, artifacts } from "../rocketh/deploy.js";

export default deployScript(
  async env => {
    const { deployer } = env.namedAccounts;

    const trusticToken = await env.deploy("TrusticToken", {
      account: deployer,
      artifact: artifacts.TrusticToken,
      // Sin argumentos: Ownable(msg.sender) ya usa al deployer
      args: [],
    });

    const name = await env.read(trusticToken, { functionName: "name" });
    const symbol = await env.read(trusticToken, { functionName: "symbol" });
    console.log(`🪙 Deployed: ${name} (${symbol})`);
  },
  {
    tags: ["TrusticToken"],
  },
);
