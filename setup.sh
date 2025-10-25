#!/bin/bash

echo "🚀 Setting up SmartSubsidy Blockchain Project..."

# Install main dependencies
echo "📦 Installing main project dependencies..."
npm install

# Setup contracts
echo "📜 Setting up smart contracts..."
cd contracts
npm install
echo "✅ Smart contracts dependencies installed"
cd ..

# Setup backend
echo "🔧 Setting up backend..."
cd backend
npm install
echo "✅ Backend dependencies installed"
cd ..

# Setup frontend
echo "🎨 Setting up frontend..."
cd frontend
npm install
echo "✅ Frontend dependencies installed"
cd ..

echo "✨ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Start local blockchain: npm run node"
echo "2. Deploy contracts: npm run deploy"
echo "3. Update contract address in backend/.env"
echo "4. Start the application: npm run dev"
echo ""
echo "🔗 Access the application at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000"
echo "   Blockchain: http://localhost:8545"
