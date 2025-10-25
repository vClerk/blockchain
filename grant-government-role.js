const { ethers } = require('ethers');

// Quick script to grant GOVERNMENT_ROLE
const SMART_SUBSIDY_ADDRESS = '0x043F679987b6B0c749FBC79B8e56AC8Ed03bc7cF';
const CELO_ALFAJORES_RPC = 'https://alfajores-forno.celo-testnet.org';

const ABI = [
  "function grantGovernmentRole(address account) external",
  "function hasRole(bytes32 role, address account) external view returns (bool)",
  "function GOVERNMENT_ROLE() external view returns (bytes32)"
];

async function grantRole() {
  // REPLACE THIS with your admin wallet private key (the one that deployed the contract)
  const adminPrivateKey = process.argv[2];
  
  if (!adminPrivateKey) {
    console.error('\n❌ ERROR: Please provide admin private key as argument');
    console.error('Usage: node grant-government-role.js YOUR_ADMIN_PRIVATE_KEY\n');
    console.error('The admin private key should be from the wallet that deployed the contract.\n');
    process.exit(1);
  }

  // The wallet to grant role to
  const targetWallet = '0x2128170857D5A55DbE38E26c758FCa13eAc3428f';

  try {
    console.log('🚀 Granting GOVERNMENT_ROLE...\n');
    
    const provider = new ethers.JsonRpcProvider(CELO_ALFAJORES_RPC);
    const adminWallet = new ethers.Wallet(adminPrivateKey, provider);
    const contract = new ethers.Contract(SMART_SUBSIDY_ADDRESS, ABI, adminWallet);

    console.log('📋 Configuration:');
    console.log('   Admin Wallet:', adminWallet.address);
    console.log('   Target Wallet:', targetWallet);
    console.log('   Contract:', SMART_SUBSIDY_ADDRESS);
    console.log('   Network: Celo Alfajores\n');

    // Check current role status
    const govRole = await contract.GOVERNMENT_ROLE();
    const hasRoleBefore = await contract.hasRole(govRole, targetWallet);
    
    console.log('📊 Current Status:');
    console.log('   Has GOVERNMENT_ROLE:', hasRoleBefore ? '✅ YES' : '❌ NO\n');

    if (hasRoleBefore) {
      console.log('✅ Wallet already has GOVERNMENT_ROLE!\n');
      return;
    }

    // Grant role
    console.log('⏳ Sending transaction...');
    const tx = await contract.grantGovernmentRole(targetWallet);
    console.log('✅ Transaction sent:', tx.hash);
    console.log('🔗 View on Explorer:', `https://explorer.celo.org/alfajores/tx/${tx.hash}\n`);

    console.log('⏳ Waiting for confirmation...');
    const receipt = await tx.wait();
    console.log('✅ Confirmed! Block:', receipt.blockNumber, '\n');

    // Verify
    const hasRoleAfter = await contract.hasRole(govRole, targetWallet);
    if (hasRoleAfter) {
      console.log('🎉 SUCCESS! GOVERNMENT_ROLE granted to', targetWallet);
      console.log('\n✅ You can now:');
      console.log('   • Create subsidy schemes');
      console.log('   • Verify farmers');
      console.log('   • Process payments');
      console.log('   • Toggle scheme status\n');
    } else {
      console.log('❌ FAILED: Role not granted\n');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    
    if (error.message.includes('0xe2517d3f')) {
      console.error('\n⚠️  Your admin wallet does not have permission to grant roles.');
      console.error('    Only the contract deployer or someone with DEFAULT_ADMIN_ROLE can grant roles.\n');
    } else if (error.message.includes('insufficient funds')) {
      console.error('\n💰 Insufficient CELO for gas fees.');
      console.error('    Get testnet CELO from: https://faucet.celo.org\n');
    }
  }
}

grantRole();
