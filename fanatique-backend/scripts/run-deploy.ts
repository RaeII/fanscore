import { task } from 'hardhat/config';

task("deploy", "Deploy contracts")
  .addParam("contract", "Identificador do contrato")
  .setAction(async (taskArgs, env) => {

    console.log("network ->",env.network.name,"\n")
 
    const contractDeploy = new Map<string, (...args: any[]) => Promise<any>>();

    const { deployFanatique,deployFanToken } = await import("./deploy/deploy");
    contractDeploy.set("fanatique", deployFanatique);
    contractDeploy.set("fantoken", deployFanToken);

    const runDeploy = contractDeploy.get(taskArgs.contract);

    if (!runDeploy) {
      throw new Error("Contract deploy not found");
    }

    // Executa a função de deploy.
    await runDeploy();
  });
