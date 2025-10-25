const { ethers } = require("hardhat");

async function checkSetup() {
  console.log("🔍 Checking deployment setup...\n");

  try {
    // Check if we can connect to Celo testnet
    const provider = new ethers.JsonRpcProvider("https://alfajores-forno.celo-testnet.org");
    const network = await provider.getNetwork();
    console.log("✅ Connected to network:", network.name || "Celo Alfajores");
    console.log("   Chain ID:", network.chainId.toString());

    // Check if we have a private key configured
    if (!process.env.PRIVATE_KEY) {
      console.log("❌ No private key found in .env file");
      console.log("   Please add: PRIVATE_KEY=your_64_character_private_key");
      return;
    }

    if (process.env.PRIVATE_KEY.length !== 64) {
      console.log("❌ Invalid private key length");
      console.log("   Private key should be 64 characters long");
      return;
    }

    console.log("✅ Private key configured");

    // Check wallet balance
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const balance = await provider.getBalance(wallet.address);
    const balanceInCelo = ethers.formatEther(balance);

    console.log("✅ Wallet configured");
    console.log("   Address:", wallet.address);
    console.log("   Balance:", balanceInCelo, "CELO");

    if (parseFloat(balanceInCelo) < 0.1) {
      console.log("⚠️  Low balance - you may need more CELO for deployment");
      console.log("   Get test tokens from: https://faucet.celo.org");
    } else {
      console.log("✅ Sufficient balance for deployment");
    }

    console.log("\n🚀 Ready to deploy! Run:");
    console.log("   npx hardhat run scripts/deploy-celo.js --network celoTestnet");

  } catch (error) {
    console.log("❌ Setup check failed:", error.message);
  }
}

checkSetup()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
