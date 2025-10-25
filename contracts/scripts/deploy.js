const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying SmartSubsidy contract...");

  // Get the contract factory
  const SmartSubsidy = await ethers.getContractFactory("SmartSubsidy");

  // Deploy the contract
  const smartSubsidy = await SmartSubsidy.deploy();
  await smartSubsidy.waitForDeployment();

  const contractAddress = await smartSubsidy.getAddress();
  console.log("SmartSubsidy deployed to:", contractAddress);

  // Get signers
  const [deployer, government, farmer1, farmer2] = await ethers.getSigners();

  console.log("Deployer address:", deployer.address);
  console.log("Government address:", government.address);
  console.log("Farmer1 address:", farmer1.address);
  console.log("Farmer2 address:", farmer2.address);

  // Setup initial data
  console.log("\nSetting up initial data...");

  // Grant government role to second signer
  await smartSubsidy.grantGovernmentRole(government.address);
  console.log("Government role granted to:", government.address);

  // Deposit initial funds (using deployer who has admin role)
  const depositAmount = ethers.parseEther("100.0"); // 100 ETH
  await smartSubsidy.depositFunds({ value: depositAmount });
  console.log("Deposited 100 ETH to contract");

  // Register sample farmers
  const smartSubsidyFarmer1 = smartSubsidy.connect(farmer1);
  await smartSubsidyFarmer1.registerFarmer(
    "John Doe",
    "Punjab, India",
    "Rice",
    50
  );
  console.log("Farmer1 registered");

  const smartSubsidyFarmer2 = smartSubsidy.connect(farmer2);
  await smartSubsidyFarmer2.registerFarmer(
    "Jane Smith",
    "Haryana, India", 
    "Wheat",
    75
  );
  console.log("Farmer2 registered");

  // Verify farmers (using government role)
  const smartSubsidyGov = smartSubsidy.connect(government);
  await smartSubsidyGov.verifyFarmer(farmer1.address);
  await smartSubsidyGov.verifyFarmer(farmer2.address);
  console.log("Farmers verified");

  // Create sample subsidy schemes
  const expiryDate = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60); // 1 year from now

  await smartSubsidyGov.createSubsidyScheme(
    "Rice Cultivation Support",
    "Financial support for rice farmers to improve productivity",
    ethers.parseEther("5.0"), // 5 ETH
    100, // max 100 beneficiaries
    expiryDate
  );

  await smartSubsidyGov.createSubsidyScheme(
    "Organic Farming Initiative",
    "Incentive for farmers adopting organic farming practices",
    ethers.parseEther("7.5"), // 7.5 ETH
    50, // max 50 beneficiaries
    expiryDate
  );

  console.log("Sample subsidy schemes created");

  // Make sample payments
  await smartSubsidyGov.paySubsidy(1, farmer1.address, "Payment for rice cultivation support");
  await smartSubsidyGov.paySubsidy(2, farmer2.address, "Payment for organic farming initiative");
  console.log("Sample payments made");

  // Display contract statistics
  const stats = await smartSubsidy.getStatistics();
  console.log("\nContract Statistics:");
  console.log("- Total Farmers:", stats[0].toString());
  console.log("- Total Schemes:", stats[1].toString());
  console.log("- Total Payments:", stats[2].toString());
  console.log("- Total Distributed:", ethers.formatEther(stats[3]), "ETH");
  console.log("- Contract Balance:", ethers.formatEther(stats[4]), "ETH");

  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    network: "localhost",
    deployer: deployer.address,
    government: government.address,
    blockNumber: await ethers.provider.getBlockNumber(),
    timestamp: new Date().toISOString()
  };

  const fs = require("fs");
  fs.writeFileSync(
    "./deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\nDeployment completed successfully!");
  console.log("Contract address saved to deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
