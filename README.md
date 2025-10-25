# 🌾 Smart Subsidy Platform

A blockchain-based agricultural subsidy distribution system built on **Celo Alfajores Testnet** that enables transparent, traceable, and instant subsidy payments to farmers.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Smart Contract Details](#smart-contract-details)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**Smart Subsidy Platform** revolutionizes agricultural subsidy distribution by leveraging blockchain technology to ensure:

- ✅ **Transparency**: All transactions are recorded on the blockchain
- ✅ **Direct Payments**: Subsidies go directly to farmers' wallets
- ✅ **Reduced Corruption**: No intermediaries, eliminating fraud
- ✅ **Real-time Tracking**: Monitor payments and schemes instantly
- ✅ **Government Dashboard**: Comprehensive admin panel for scheme management
- ✅ **Farmer Portal**: Simple interface for farmers to track their subsidies

---

## ✨ Features

### For Government/Administrators
- 📊 **Dashboard**: Real-time statistics and analytics
- 🎯 **Scheme Management**: Create and manage subsidy schemes
- ✅ **Farmer Verification**: Verify and approve farmer registrations
- 💰 **Payment Processing**: Distribute subsidies with MetaMask
- 🔄 **Blockchain Sync**: Auto-sync data from smart contracts
- 📈 **Reporting**: View all transactions and payment history

### For Farmers
- 📝 **Self-Registration**: Register via MetaMask wallet
- 🏦 **Wallet Integration**: Receive payments directly to MetaMask
- 📊 **Payment History**: Track all received subsidies
- 🔍 **Scheme Discovery**: View available subsidy schemes
- ✅ **Verification Status**: Monitor approval status

### Technical Features
- 🔐 **MetaMask Authentication**: Secure wallet-based login
- ⛓️ **Celo Blockchain**: Fast, low-cost transactions
- 🔄 **RPC Resilience**: Graceful degradation when RPC is down
- 💾 **Dual Storage**: Blockchain + SQLite for optimal performance
- 🎨 **Material-UI**: Modern, responsive interface
- 🔧 **RESTful API**: Well-documented backend endpoints

---

## 🛠️ Technology Stack

### Blockchain
- **Network**: Celo Alfajores Testnet (Chain ID: 44787)
- **Smart Contracts**: Solidity ^0.8.0
- **Contract Address**: `0x043F679987b6B0c749FBC79B8e56AC8Ed03bc7cF`
- **Library**: ethers.js v6.x

### Backend
- **Runtime**: Node.js (v16+)
- **Framework**: Express.js
- **Database**: SQLite3
- **Authentication**: MetaMask wallet signatures
- **API**: RESTful with JSON responses

### Frontend
- **Framework**: React.js (v18+)
- **UI Library**: Material-UI (MUI v5)
- **Routing**: React Router v6
- **State Management**: React Context API
- **Web3**: MetaMask integration

### Development Tools
- **Version Control**: Git
- **Package Manager**: npm
- **Code Editor**: VS Code (recommended)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Government  │  │    Farmer    │  │    Public    │      │
│  │  Dashboard   │  │   Portal     │  │   Viewer     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/REST API
┌───────────────────────────▼─────────────────────────────────┐
│                    Backend (Express + SQLite)                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Routes  │  Auth  │  Database  │  Blockchain     │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │ ethers.js
┌───────────────────────────▼─────────────────────────────────┐
│                    Celo Alfajores Testnet                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         SmartSubsidy Smart Contract                  │  │
│  │  • registerFarmer()  • createScheme()                │  │
│  │  • verifyFarmer()    • distributeSubsidy()           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                     MetaMask Wallet                          │
│         (User's wallet for authentication & payments)        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v16 or higher)
   ```bash
   node --version
   ```

2. **npm** (comes with Node.js)
   ```bash
   npm --version
   ```

3. **Git** (for cloning the repository)
   ```bash
   git --version
   ```

4. **MetaMask Browser Extension**
   - Install from [metamask.io](https://metamask.io)
   - Create a wallet and save your seed phrase
   - Add Celo Alfajores Testnet to MetaMask

### Setting Up MetaMask for Celo Alfajores

1. Open MetaMask
2. Click the network dropdown (top center)
3. Click "Add Network" → "Add Network Manually"
4. Enter the following details:
   - **Network Name**: Celo Alfajores Testnet
   - **RPC URL**: `https://alfajores-forno.celo-testnet.org`
   - **Chain ID**: `44787`
   - **Currency Symbol**: `CELO`
   - **Block Explorer**: `https://alfajores.celoscan.io`
5. Click "Save"

### Getting Test CELO Tokens

1. Visit [Celo Alfajores Faucet](https://faucet.celo.org/alfajores)
2. Connect your MetaMask wallet
3. Request test CELO tokens (free)

---

## 📥 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd blockchain2
```

### 2. Install Dependencies

**Backend:**
```bash
cd backend
npm install
cd ..
```

**Frontend:**
```bash
cd frontend
npm install
cd ..
```

---

## ⚙️ Configuration

### Backend Configuration

Create `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Blockchain Configuration
BLOCKCHAIN_NETWORK=https://alfajores-forno.celo-testnet.org
CONTRACT_ADDRESS=0x043F679987b6B0c749FBC79B8e56AC8Ed03bc7cF
CHAIN_ID=44787

# RPC Configuration
RPC_TIMEOUT=30000
RPC_RETRY_ATTEMPTS=3

# Database Configuration
DB_PATH=./blockchain.db

# Session Configuration
SESSION_SECRET=your-secret-key-here

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend Configuration

The frontend automatically connects to `http://localhost:5000` for the backend API.

**Contract ABI Location:**
- Ensure `frontend/src/config/contractABI.json` exists
- This file contains the SmartSubsidy contract ABI

---

## 🚀 Running the Application

### Method 1: Run Both Servers Separately

**Terminal 1 - Start Backend:**
```bash
cd backend
npm start
```
Backend will run on: `http://localhost:5000`

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm start
```
Frontend will run on: `http://localhost:3000`

### Method 2: PowerShell Quick Start

```powershell
# Start Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm start"

# Start Frontend (after 5 seconds)
Start-Sleep -Seconds 5
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm start"
```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

---

## 📜 Smart Contract Details

### Contract Address
```
0x043F679987b6B0c749FBC79B8e56AC8Ed03bc7cF
```

### Key Functions

#### For Farmers
- `registerFarmer(name, location, cropType, farmSize)` - Register as a farmer
- `getFarmerDetails(address)` - Get farmer information

#### For Government
- `verifyFarmer(address)` - Verify a registered farmer
- `createScheme(name, description, amount, maxBeneficiaries, expiryDate)` - Create subsidy scheme
- `distributeSubsidy(farmerAddress, schemeId, amount)` - Send subsidy payment

#### View Functions
- `getTotalFarmers()` - Get total registered farmers
- `getTotalSchemes()` - Get total schemes created
- `getScheme(schemeId)` - Get scheme details
- `getPaymentHistory(farmerAddress)` - Get farmer's payment history

### Events Emitted
- `FarmerRegistered(address, name, timestamp)`
- `FarmerVerified(address, timestamp)`
- `SchemeCreated(uint schemeId, name, amount)`
- `SubsidyDistributed(farmer, schemeId, amount, timestamp)`

---

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
Most endpoints require MetaMask wallet connection. The wallet address is used for authorization.

### Endpoints

#### Health Check
```http
GET /health
```
Response: `{ status: "ok", message: "Server is running" }`

#### Statistics
```http
GET /blockchain/stats
```
Returns: Total farmers, schemes, on-chain data

#### Farmers

**Get All Farmers**
```http
GET /blockchain/farmers
```

**Get Specific Farmer**
```http
GET /blockchain/farmer/:address
```

**Register Farmer** (via MetaMask)
```http
POST /blockchain/register-farmer
Body: { name, location, cropType, farmSize, signature }
```

**Sync Farmer from Blockchain**
```http
POST /blockchain/sync-farmer/:address
```

**Auto-Sync All Farmers**
```http
POST /blockchain/auto-sync-farmers
```

#### Schemes

**Get All Schemes**
```http
GET /blockchain/schemes
```

**Create Scheme** (via MetaMask)
```http
POST /blockchain/create-scheme
Body: { name, description, amount, maxBeneficiaries, expiryDate }
```

**Sync Scheme from Blockchain**
```http
POST /blockchain/sync-scheme/:id
```

**Save Scheme Manually**
```http
POST /blockchain/save-scheme
Body: { schemeId, name, description, amount, maxBeneficiaries, expiryDate, creator, transactionHash }
```

**Delete Scheme**
```http
DELETE /blockchain/scheme/:id
```

---

## 🐛 Troubleshooting

### Common Issues and Solutions

#### 1. **Backend Won't Start**
```bash
# Check if port 5000 is already in use
netstat -ano | findstr :5000

# Kill the process if needed
taskkill /PID <process_id> /F

# Restart backend
cd backend
npm start
```

#### 2. **Frontend Won't Compile**
```bash
# Clear node_modules and reinstall
cd frontend
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
npm start
```

#### 3. **MetaMask Not Connecting**
- Ensure MetaMask is unlocked
- Check that you're on Celo Alfajores network
- Refresh the page and reconnect
- Clear browser cache if persistent

#### 4. **RPC Errors: "no backend is currently healthy"**
- This is a known Celo Alfajores RPC issue
- The system is designed to handle this gracefully
- Transactions via MetaMask still work
- Auto-sync will work when RPC recovers
- Manual scheme saves bypass RPC entirely

#### 5. **Scheme Shows Empty Data**
- This was fixed in the latest update
- Delete incomplete schemes: `DELETE /api/blockchain/scheme/:id`
- Create new scheme - it will save with complete data

#### 6. **Database Issues**
```bash
# Reset database
cd backend
Remove-Item blockchain.db
npm start  # Will recreate database
```

#### 7. **Transaction Failing**
- Ensure you have enough test CELO in your wallet
- Check gas fees are sufficient
- Verify you're on the correct network (Celo Alfajores)
- Try increasing gas limit in MetaMask

---

## 📁 Project Structure

```
blockchain2/
├── backend/
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   └── blockchain.js        # Blockchain API routes
│   ├── services/
│   │   ├── blockchain.js        # Blockchain service (ethers.js)
│   │   └── database.js          # SQLite database service
│   ├── config/
│   │   └── contractABI.json     # Smart contract ABI
│   ├── .env                     # Environment variables
│   ├── server.js                # Express server entry point
│   ├── blockchain.db            # SQLite database (auto-generated)
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/          # Reusable components
│   │   ├── contexts/
│   │   │   └── Web3Context.js   # Web3/MetaMask context
│   │   ├── pages/
│   │   │   ├── GovernmentDashboard.js
│   │   │   ├── FarmerDashboard.js
│   │   │   ├── SchemeCreation.js
│   │   │   ├── FarmerRegistration.js
│   │   │   └── Login.js
│   │   ├── services/
│   │   │   ├── api.js           # Axios API client
│   │   │   └── metamask.js      # MetaMask service
│   │   ├── config/
│   │   │   └── contractABI.json # Smart contract ABI
│   │   ├── App.js               # Main app component
│   │   └── index.js             # React entry point
│   └── package.json
│
├── README.md                     # This file
└── .gitignore
```

---

## 🔐 Security Considerations

### Current Implementation
- ✅ MetaMask-based authentication
- ✅ Wallet signature verification
- ✅ Role-based access (Government vs Farmer)
- ✅ Direct blockchain verification
- ✅ No private keys stored on backend

### Recommended Enhancements (Production)
- [ ] Rate limiting on API endpoints
- [ ] HTTPS/TLS encryption
- [ ] Multi-signature for large payments
- [ ] Smart contract auditing
- [ ] Input sanitization and validation
- [ ] CORS whitelist for specific domains
- [ ] Session timeout management
- [ ] Audit logging for all transactions

---

## 🧪 Testing

### Manual Testing Workflow

**1. Test Farmer Registration**
```
1. Connect MetaMask
2. Navigate to "Register as Farmer"
3. Fill in details
4. Submit transaction
5. Verify farmer appears in Government Dashboard
```

**2. Test Farmer Verification**
```
1. Login as Government
2. Go to "Farmers" tab
3. Click "Verify" on pending farmer
4. Confirm MetaMask transaction
5. Check status changes to "Verified"
```

**3. Test Scheme Creation**
```
1. Login as Government
2. Go to "Create Subsidy Scheme"
3. Fill in scheme details
4. Submit transaction
5. Verify scheme appears in "Schemes" tab with complete data
```

**4. Test Payment Distribution**
```
1. Create a scheme
2. Verify a farmer
3. Navigate to "Process Payment"
4. Select farmer and scheme
5. Distribute subsidy
6. Check transaction on Celoscan
```

---

## 📊 Database Schema

### Farmers Table
```sql
CREATE TABLE farmers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  address TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  cropType TEXT,
  farmSize INTEGER,
  isVerified INTEGER DEFAULT 0,
  registeredAt INTEGER,
  registrationTxHash TEXT,
  createdAt INTEGER DEFAULT (strftime('%s', 'now')),
  updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
);
```

### Schemes Table
```sql
CREATE TABLE schemes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  schemeId INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  amount REAL,
  maxBeneficiaries INTEGER,
  expiryDate INTEGER,
  transactionHash TEXT,
  createdAt INTEGER DEFAULT (strftime('%s', 'now')),
  updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
);
```

### Payments Table
```sql
CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  farmerAddress TEXT NOT NULL,
  schemeId INTEGER NOT NULL,
  amount REAL NOT NULL,
  timestamp INTEGER NOT NULL,
  transactionHash TEXT,
  remarks TEXT,
  createdAt INTEGER DEFAULT (strftime('%s', 'now'))
);
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Coding Standards
- Use ESLint for JavaScript linting
- Follow React best practices
- Write meaningful commit messages
- Add comments for complex logic
- Test before submitting PR

---

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review the troubleshooting section

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- **Celo Foundation** - For providing the Alfajores testnet
- **MetaMask** - For wallet integration
- **Material-UI** - For beautiful React components
- **ethers.js** - For blockchain interactions
- **Express.js** - For backend framework

---

## 📈 Roadmap

### Phase 1 (Current) ✅
- [x] Basic farmer registration
- [x] Government dashboard
- [x] Scheme creation
- [x] MetaMask integration
- [x] Payment distribution
- [x] RPC resilience

### Phase 2 (Planned)
- [ ] Mobile app (React Native)
- [ ] Email notifications
- [ ] Advanced analytics dashboard
- [ ] Farmer verification via Aadhaar/ID
- [ ] Multi-language support
- [ ] SMS notifications for farmers

### Phase 3 (Future)
- [ ] AI-based fraud detection
- [ ] Crop insurance integration
- [ ] Marketplace for farmers
- [ ] IOT sensor integration
- [ ] Weather data integration
- [ ] Mainnet deployment

---

## 🌟 Key Features Summary

| Feature | Status | Description |
|---------|--------|-------------|
| Farmer Registration | ✅ Complete | Self-registration via MetaMask |
| Farmer Verification | ✅ Complete | Government can verify farmers |
| Scheme Creation | ✅ Complete | Create subsidy schemes |
| Payment Distribution | ✅ Complete | Direct payments to farmers |
| Dashboard | ✅ Complete | Real-time stats and management |
| RPC Resilience | ✅ Complete | Works even when RPC is down |
| Auto-Sync | ✅ Complete | Sync blockchain data automatically |
| Manual Sync | ✅ Complete | Fallback when RPC unavailable |

---

**Built with ❤️ for farmers and transparent governance**

**Version:** 1.0.0  
**Last Updated:** October 25, 2025
