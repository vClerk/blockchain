# Smart Subsidy Platform on Celo (Alfajores)

A production-ready, role-secured, blockchain-powered subsidy management system. This README is structured so you can turn it directly into a presentation (PPT/Slides) with minimal edits.

---

## 1) Executive Summary (Slide 1)
- Problem: Manual, opaque subsidy disbursements lead to leakage and delays.
- Solution: On-chain subsidy programs with transparent rules, verifiable events, and role-based control.
- Tech Stack: Celo Alfajores (Testnet), Solidity, Hardhat, React, Node/Express, ethers.js.
- Security: JWT auth, wallet signature verification, strict CORS, rate limiting, no private-key transmission.
- Status: End-to-end working flows (Register → Verify → Create Scheme → Pay), explorer-linked.

---

## 2) Business Goals (Slide 2)
- Ensure only verified farmers receive subsidies.
- Enable government to activate/deactivate and fund schemes transparently.
- Traceable payments with public auditability via Blockscout.
- Low fees and fast finality using Celo.

---

## 3) System Architecture (Slides 3–4)

High-level components:
- Frontend (React + MUI): dashboards for Government and Farmers, MetaMask signing, explorer links.
- Backend (Express + SQLite): auth, validation, blockchain tx receipt verification, APIs.
- Smart Contract (Solidity): core business logic, OpenZeppelin AccessControl (GOVERNMENT_ROLE).
- Celo Alfajores: L1 settlement and public audit via Blockscout.

Data flow:
1. User action on UI → MetaMask signs and sends tx
2. Backend receives tx hash → verifies on-chain receipt and contract address
3. Backend writes sanitized records to database
4. UI fetches state from API + on-chain for real-time status

---

## 4) Smart Contract Overview (Slides 5–6)
- Name: SmartSubsidy (AccessControl-based)
- Key functions:
  - registerFarmer(address/metadata)
  - verifyFarmer(address)
  - createSubsidyScheme(name, description, amount, limits, expiry)
  - paySubsidy(schemeId, farmer)
  - toggleSchemeStatus(schemeId)
- Events:
  - SchemeCreated(schemeId, name, amount, creator)
  - FarmerVerified(farmer)
  - SubsidyPaid(schemeId, farmer, amount)
- Roles:
  - DEFAULT_ADMIN_ROLE → can grant roles
  - GOVERNMENT_ROLE → can verify farmers, create schemes, toggle status, make payments, deposit funds

---

## 5) Security Model (Slides 7–9)
- Authentication:
  - JWT with strong secret (>= 32 chars) and 24h expiry
  - Wallet signature verification with 5-minute replay window
- Authorization:
  - requireRole('government') on protected backend routes
  - Smart contract GOVERNMENT_ROLE required for on-chain privileged calls
- Input & Transport:
  - NO private keys sent to backend (ever)
  - Frontend signs with MetaMask; backend receives tx hash only
  - Backend verifies tx on-chain: existence, success, to=contract
- App Hardening:
  - Strict CORS (allowed origins via ALLOWED_ORIGINS)
  - Rate limiting: general/auth/blockchain tiers
  - Sanitized logs (remove tokens/keys)
  - Error messages sanitized in production

---

## 6) Deployment (Slides 10–11)

Network:
- Celo Alfajores Testnet (Chain ID: 44787)
- RPC: https://alfajores-forno.celo-testnet.org
- Explorer (Blockscout): https://celo-alfajores.blockscout.com

Contract (current deployment):
- Address: 0x043F679987b6B0c749FBC79B8e56AC8Ed03bc7cF

Deploy script: `scripts/deploy-celo.js`
- Builds and deploys SmartSubsidy
- Waits for confirmations
- Writes frontend config to `frontend/src/config/contracts.json`

PowerShell (Windows) commands (example):
```powershell
# From project root
cd .\backend; npm install; cd ..
cd .\frontend; npm install; cd ..

# Deploy with Hardhat (configured network required)
npx hardhat run scripts/deploy-celo.js --network alfajores
```

---

## 7) Configuration (Slide 12)

Backend `.env` (sample):
- JWT_SECRET=<64+ random hex>
- ALLOWED_ORIGINS=http://localhost:3000
- CONTRACT_ADDRESS=0x043F679987b6B0c749FBC79B8e56AC8Ed03bc7cF
- BLOCKCHAIN_NETWORK=alfajores
- NODE_ENV=development

Generate secrets:
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 8) Running the App (Slide 13)
```powershell
# Backend
cd .\backend
node server.js

# Frontend
cd ..\frontend
npm start
```
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

---

## 9) Roles: Grant GOVERNMENT_ROLE (Slide 14)
Required to verify farmers, create schemes, pay subsidies.

Grant role (quick script):
```powershell
cd C:\Users\sampa\OneDrive\Desktop\blockchain2
node grant-role-quick.js YOUR_ADMIN_PRIVATE_KEY
```
- TARGET wallet (example): 0xe8d5f6956535eaf96d1bc15dd7a9289203de26cb
- View tx: https://celo-alfajores.blockscout.com

Alternative: Blockscout → Write Contract → `grantRole(role, account)`
- GOVERNMENT_ROLE hash: keccak256("GOVERNMENT_ROLE")

---

## 10) End-to-End Flows (Slides 15–17)

A) Register Farmer (UI)
- MetaMask call: contract.registerFarmer(...)
- Backend receives tx hash → verifies on-chain → stores sanitized record

B) Verify Farmer (Government)
- Government wallet (with GOVERNMENT_ROLE) clicks Verify
- MetaMask calls contract.verifyFarmer(farmer)
- Backend records verified status (also checks chain)

C) Create Scheme (Government)
- MetaMask calls createSubsidyScheme(...)
- Backend parses SchemeCreated event to derive `schemeId`
- Dashboard updates with chain + DB state merged

D) Pay Subsidy
- Contract needs CELO balance (fund via faucet/transfer)
- MetaMask calls paySubsidy(id, farmer)
- Backend stores tx record and updates UI with explorer link

---

## 11) Explorer & Observability (Slide 18)
- Contract: https://celo-alfajores.blockscout.com/address/0x043F679987b6B0c749FBC79B8e56AC8Ed03bc7cF
- Transactions are publicly visible
- UI links per tx (FarmerDashboard) and contract (GovernmentDashboard)

---

## 12) API Overview (Slide 19)
Protected routes require `Authorization: Bearer <JWT>`.
- POST `/api/auth/login` → wallet signature based
- GET `/api/blockchain/farmers` → list
- GET `/api/blockchain/schemes` → DB + on-chain enriched
- POST `/api/blockchain/register-farmer` → { name, location, cropType, farmSize, transactionHash, farmerAddress }
- POST `/api/blockchain/verify-farmer` → { farmerAddress, transactionHash }
- POST `/api/blockchain/create-scheme` → { name, description, amount, maxBeneficiaries, expiryDate, transactionHash, creatorAddress }
- POST `/api/blockchain/pay-subsidy` → { schemeId, farmerAddress, remarks, transactionHash }
- POST `/api/blockchain/deposit-funds` → { amount, transactionHash }

Validation on backend:
- Ethereum address and tx hash format enforced
- Contract address match checked on receipt
- Production-safe error responses

---

## 13) Security Highlights (Slides 20–22)
- No private keys in transit or at rest
- JWT secret length enforced (server refuses weak secrets in production)
- Signature replay protection (5 minutes window)
- Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, etc.)
- Strict origin validation (`validateOrigin` middleware)
- Rate limiting tuned for dev vs prod
- Log sanitization (`[REDACTED]` sensitive fields)

---

## 14) Troubleshooting (Slide 23)
- Access Denied: GOVERNMENT_ROLE
  - Grant role via script or Blockscout
- Insufficient Contract Balance
  - Fund contract with test CELO (https://faucet.celo.org/alfajores)
- Invalid Scheme IDs from legacy data
  - Old timestamp-based IDs in DB can’t be toggled; new schemes use on-chain IDs
- 429 Too Many Requests
  - Dev limits are high; in prod, adjust rate limit configs

---

## 15) Roadmap & Improvements (Slide 24)
- Multi-sig for large payments
- Real OAuth + 2FA for admins
- Contract pause/upgrade patterns
- Audit logging and SIEM integration
- Feature flags for scheme lifecycle rules

---

## 16) Demo Checklist (Slide 25)
1. Connect MetaMask to Celo Alfajores
2. Login → Get JWT via signature
3. Register a farmer (emit tx, show explorer)
4. Grant GOVERNMENT_ROLE to your wallet (only once)
5. Verify the farmer
6. Create a scheme; show event-based `schemeId`
7. Deposit CELO to contract (if needed)
8. Pay subsidy; show explorer link from UI

---

## 17) PPT Slide Outline (Copy/Paste) (Slide 26)
1. Title & Executive Summary
2. Problem & Goals
3. Architecture Overview
4. Smart Contract Design
5. Security Model (App)
6. Security Model (On-Chain Roles)
7. Deployment & Networks
8. Configuration & Secrets
9. Role Granting (GOVERNMENT_ROLE)
10. End-to-End Flows
11. API & Validation
12. Blockscout & Observability
13. Troubleshooting
14. Roadmap
15. Live Demo

---

## 18) Key Links (Final Slide)
- Contract (Blockscout): https://celo-alfajores.blockscout.com/address/0x043F679987b6B0c749FBC79B8e56AC8Ed03bc7cF
- Faucet: https://faucet.celo.org/alfajores
- RPC: https://alfajores-forno.celo-testnet.org

---

## Appendix A: Diagrams (Optional)

Roles & Flows (ASCII):
```
[ Farmer ] --register--> [ SmartSubsidy ]
                         ^       |
                         |       | verify (GOVERNMENT_ROLE)
                    create/toggle/pay
                         |
                 [ Government Wallet ]
```

On-Chain/Off-Chain Sync:
```
UI (MetaMask) --> TX --> Celo
       |                    ^
       v                    |
   tx hash              receipt
       |                    |
     API ---- verify ----> Backend ---- store sanitized DB ----> UI
```
