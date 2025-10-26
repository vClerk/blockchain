// Quick script to grant GOVERNMENT_ROLE to your wallet
// Usage: node grant-role-quick.js YOUR_ADMIN_PRIVATE_KEY

const { ethers } = require('ethers');

// Configuration
const CONTRACT_ADDRESS = '0x043F679987b6B0c749FBC79B8e56AC8Ed03bc7cF';
const TARGET_WALLET = '0xe8d5f6956535eaf96d1bc15dd7a9289203de26cb'; // Your wallet that needs the role
const RPC_URL = 'https://alfajores-forno.celo-testnet.org';
const GOVERNMENT_ROLE = ethers.keccak256(ethers.toUtf8Bytes("GOVERNMENT_ROLE"));

// Minimal ABI
const CONTRACT_ABI = [
  "function grantRole(bytes32 role, address account) external",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function DEFAULT_ADMIN_ROLE() view returns (bytes32)"
];

async function grantRole() {
  try {
    // Get admin private key from command line
    const adminPrivateKey = process.argv[2];
    
    if (!adminPrivateKey) {
      console.error('❌ Error: Admin private key required');
      console.log('\n📖 Usage: node grant-role-quick.js YOUR_ADMIN_PRIVATE_KEY');
      console.log('\n💡 The admin private key is the one you used to deploy the contract');
      process.exit(1);
    }

    console.log('🔗 Connecting to Celo Alfajores...');
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const adminWallet = new ethers.Wallet(adminPrivateKey, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, adminWallet);

    console.log(`\n📋 Configuration:`);
    console.log(`   Contract: ${CONTRACT_ADDRESS}`);
    console.log(`   Admin Wallet: ${adminWallet.address}`);
    console.log(`   Target Wallet: ${TARGET_WALLET}`);

    // Check if admin has DEFAULT_ADMIN_ROLE
    console.log('\n🔍 Checking admin permissions...');
    const DEFAULT_ADMIN_ROLE = await contract.DEFAULT_ADMIN_ROLE();
    const isAdmin = await contract.hasRole(DEFAULT_ADMIN_ROLE, adminWallet.address);
    
    if (!isAdmin) {
      console.error(`\n❌ Error: Wallet ${adminWallet.address} is not an admin`);
      console.error('   Only the contract deployer can grant roles');
      process.exit(1);
    }
    console.log('   ✅ Admin verified');

    // Check if target already has the role
    console.log('\n🔍 Checking current roles...');
    const hasRole = await contract.hasRole(GOVERNMENT_ROLE, TARGET_WALLET);
    
    if (hasRole) {
      console.log(`\n✅ Wallet ${TARGET_WALLET} already has GOVERNMENT_ROLE!`);
      console.log('\n🎉 No action needed - you can verify farmers now');
      process.exit(0);
    }

    // Grant the role
    console.log('\n📝 Granting GOVERNMENT_ROLE...');
    const tx = await contract.grantRole(GOVERNMENT_ROLE, TARGET_WALLET);
    console.log(`   Transaction sent: ${tx.hash}`);
    console.log(`   🔗 View on Blockscout: https://celo-alfajores.blockscout.com/tx/${tx.hash}`);
    
    console.log('\n⏳ Waiting for confirmation...');
    await tx.wait();
    
    // Verify the role was granted
    const nowHasRole = await contract.hasRole(GOVERNMENT_ROLE, TARGET_WALLET);
    
    if (nowHasRole) {
      console.log('\n✅ SUCCESS! GOVERNMENT_ROLE granted to ' + TARGET_WALLET);
      console.log('\n🎉 You can now:');
      console.log('   • Verify farmers');
      console.log('   • Create subsidy schemes');
      console.log('   • Process payments');
      console.log('   • Toggle scheme status');
      console.log('   • Deposit funds');
      console.log('\n🔄 Refresh your dashboard and try verifying again!');
    } else {
      console.error('\n❌ Error: Role grant transaction succeeded but role not found');
      console.error('   Please check the transaction on Blockscout');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.message.includes('insufficient funds')) {
      console.error('\n💡 Your admin wallet needs CELO tokens for gas fees');
      console.error('   Get test CELO: https://faucet.celo.org/alfajores');
    } else if (error.message.includes('invalid private key')) {
      console.error('\n💡 Make sure your private key:');
      console.error('   1. Starts with 0x');
      console.error('   2. Is 66 characters long (0x + 64 hex chars)');
      console.error('   3. Is the deployer/admin wallet private key');
    }
    
    process.exit(1);
  }
}

// Run the function
grantRole();
