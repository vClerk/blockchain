#!/bin/bash

# SmartSubsidy Deployment Script for Celo
echo "🚀 SmartSubsidy Deployment to Celo Blockchain"
echo "============================================="

# Check if we're in the right directory
if [ ! -f "contracts/hardhat.config.js" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if .env file exists
if [ ! -f "contracts/.env" ]; then
    echo "❌ Error: contracts/.env file not found"
    echo "📝 Please create contracts/.env with your private key:"
    echo "   PRIVATE_KEY=your_64_character_private_key_here"
    echo "   ALFAJORES_URL=https://alfajores-forno.celo-testnet.org"
    exit 1
fi

# Check if private key is set
source contracts/.env
if [ -z "$PRIVATE_KEY" ] || [ "$PRIVATE_KEY" = "your_64_character_private_key_here" ]; then
    echo "❌ Error: Please set a valid PRIVATE_KEY in contracts/.env"
    echo "🔐 Get a private key from MetaMask (Account Details → Export Private Key)"
    echo "💰 Get test CELO from: https://faucet.celo.org/"
    exit 1
fi

echo "✅ Environment configured"
echo "📁 Changing to contracts directory..."
cd contracts

echo "🔨 Compiling smart contracts..."
npm run compile
if [ $? -ne 0 ]; then
    echo "❌ Compilation failed"
    exit 1
fi

echo "🌐 Deploying to Celo Alfajores Testnet..."
npx hardhat run scripts/deploy-celo.js --network celoTestnet

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 SUCCESS! Contract deployed to Celo Alfajores Testnet"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Check frontend/src/config/contracts.json for contract address"
    echo "2. Update frontend/.env with the contract address"
    echo "3. Restart your frontend application"
    echo "4. Test the application with MetaMask on Celo network"
    echo ""
    echo "🔍 View your contract on Celo Explorer:"
    echo "   https://alfajores.celoscan.io/"
else
    echo "❌ Deployment failed"
    echo "💡 Common issues:"
    echo "   - Insufficient CELO balance (get tokens from faucet)"
    echo "   - Invalid private key"
    echo "   - Network connectivity issues"
fi
