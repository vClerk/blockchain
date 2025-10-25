@echo off
echo 🚀 SmartSubsidy Deployment to Celo Blockchain
echo =============================================

REM Check if we're in the right directory
if not exist "contracts\hardhat.config.js" (
    echo ❌ Error: Please run this script from the project root directory
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist "contracts\.env" (
    echo ❌ Error: contracts\.env file not found
    echo 📝 Please create contracts\.env with your private key:
    echo    PRIVATE_KEY=your_64_character_private_key_here
    echo    ALFAJORES_URL=https://alfajores-forno.celo-testnet.org
    pause
    exit /b 1
)

echo ✅ Environment configured
echo 📁 Changing to contracts directory...
cd contracts

echo 🔨 Compiling smart contracts...
call npm run compile
if errorlevel 1 (
    echo ❌ Compilation failed
    pause
    exit /b 1
)

echo 🌐 Deploying to Celo Alfajores Testnet...
call npx hardhat run scripts/deploy-celo.js --network celoTestnet

if errorlevel 0 (
    echo.
    echo 🎉 SUCCESS! Contract deployed to Celo Alfajores Testnet
    echo.
    echo 📋 Next Steps:
    echo 1. Check frontend/src/config/contracts.json for contract address
    echo 2. Update frontend/.env with the contract address
    echo 3. Restart your frontend application
    echo 4. Test the application with MetaMask on Celo network
    echo.
    echo 🔍 View your contract on Celo Explorer:
    echo    https://alfajores.celoscan.io/
) else (
    echo ❌ Deployment failed
    echo 💡 Common issues:
    echo    - Insufficient CELO balance ^(get tokens from faucet^)
    echo    - Invalid private key
    echo    - Network connectivity issues
)

pause
