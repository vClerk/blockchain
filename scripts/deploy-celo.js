const hre = require("hardhat");

async function main() {
  console.log("Deploying SmartSubsidy to Celo Alfajores testnet...");

  // Get the ContractFactory and Signers here.
  const SmartSubsidy = await hre.ethers.getContractFactory("SmartSubsidy");
  
  // Deploy the contract
  console.log("Deploying contract...");
  const smartSubsidy = await SmartSubsidy.deploy();
  
  // Wait for deployment to finish
  await smartSubsidy.deployed();

  console.log("SmartSubsidy deployed to:", smartSubsidy.address);
  console.log("Transaction hash:", smartSubsidy.deployTransaction.hash);
  
  // Wait for a few confirmations
  console.log("Waiting for confirmations...");
  await smartSubsidy.deployTransaction.wait(2);
  
  console.log("Deployment confirmed!");
  
  // Save the contract address and ABI for frontend use
  const fs = require('fs');
  const path = require('path');
  
  const deploymentInfo = {
    contractAddress: smartSubsidy.address,
    network: hre.network.name,
    deployedAt: new Date().toISOString(),
    transactionHash: smartSubsidy.deployTransaction.hash
  };
  
  // Create frontend config file
  const frontendConfigPath = path.join(__dirname, '../frontend/src/config/contracts.json');
  fs.writeFileSync(frontendConfigPath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("Contract info saved to frontend config");
  console.log("Contract Address:", smartSubsidy.address);
  console.log("Network:", hre.network.name);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
