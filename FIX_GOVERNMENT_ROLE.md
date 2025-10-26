# 🔐 HOW TO FIX: GOVERNMENT_ROLE Access Denied

## ❌ The Error You're Seeing:

```
Failed to verify farmer: ❌ Access Denied: Your wallet does not have GOVERNMENT_ROLE.
Only government officials can verify farmers.
Your wallet: 0xe8d5f6956535eaf96d1bc15dd7a9289203de26cb
```

## ✅ Why This Is Happening:

**This is NOT a bug!** Your smart contract has role-based access control (which is GOOD for security). 

The wallet you're using (`0xe8d5f6956535eaf96d1bc15dd7a9289203de26cb`) doesn't have GOVERNMENT_ROLE yet, so it cannot:
- ✗ Verify farmers
- ✗ Create subsidy schemes  
- ✗ Process payments
- ✗ Toggle scheme status

## 🚀 QUICK FIX (5 minutes):

### Step 1: Get Your Admin Private Key
You need the **private key of the wallet that deployed the contract**. This is usually:
- In your `.env` file as `PRIVATE_KEY`
- In MetaMask (export private key for the deployer account)
- In Hardhat/Truffle deployment logs

### Step 2: Run the Role Granting Script
```powershell
# Navigate to your project folder
cd C:\Users\sampa\OneDrive\Desktop\blockchain2

# Run the script with your admin private key
node grant-role-quick.js YOUR_ADMIN_PRIVATE_KEY_HERE
```

**Example:**
```powershell
node grant-role-quick.js 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### Step 3: Verify It Worked
The script will show:
```
✅ SUCCESS! GOVERNMENT_ROLE granted to 0xe8d5f6956535eaf96d1bc15dd7a9289203de26cb

🎉 You can now:
   • Verify farmers
   • Create subsidy schemes
   • Process payments
   • Toggle scheme status
   • Deposit funds

🔄 Refresh your dashboard and try verifying again!
```

### Step 4: Test
1. Refresh your Government Dashboard
2. Click "Verify" on any farmer
3. It should work now! ✅

---

## 🔄 Alternative Methods:

### Method 2: Using Blockscout (Web Interface)

1. Go to your contract on Blockscout:
   https://celo-alfajores.blockscout.com/address/0x043F679987b6B0c749FBC79B8e56AC8Ed03bc7cF

2. Click "Write Contract" tab

3. Connect your **admin wallet** (the one that deployed the contract)

4. Find the `grantRole` function

5. Fill in:
   - **role**: `0x0e2208b985167e9d42e889a2f0b174fc0356bca4b5e06b1d757411428fbb3fd7`
   - **account**: `0xe8d5f6956535eaf96d1bc15dd7a9289203de26cb`

6. Click "Write" and confirm in MetaMask

### Method 3: Using Frontend (If You Have Admin Access UI)

If your app has an admin panel, use it to grant the role there.

---

## 🎯 What This Does:

The script/process grants **GOVERNMENT_ROLE** to wallet `0xe8d5f6956535eaf96d1bc15dd7a9289203de26cb`, giving it permission to:

✅ **Verify Farmers** - Approve farmer registrations  
✅ **Create Schemes** - Set up new subsidy programs  
✅ **Process Payments** - Distribute subsidies to farmers  
✅ **Toggle Schemes** - Activate/deactivate programs  
✅ **Deposit Funds** - Add CELO to contract  

---

## ⚠️ Important Notes:

1. **You need the ADMIN wallet** (contract deployer) to grant roles
2. **Keep admin private key secure** - don't share or commit to git
3. **Admin wallet needs CELO** for gas fees (get from faucet if needed)
4. **This is a one-time setup** - once granted, the role persists

---

## 🆘 Troubleshooting:

### "Wallet is not an admin"
- Make sure you're using the private key that deployed the contract
- Check your deployment logs to find the correct admin wallet

### "Insufficient funds"
- Admin wallet needs CELO for gas
- Get test CELO: https://faucet.celo.org/alfajores

### "Invalid private key"
- Make sure it starts with `0x`
- Should be 66 characters long (0x + 64 hex chars)
- No spaces or quotes

### Still Not Working?
1. Check the transaction on Blockscout
2. Verify the target wallet address is correct
3. Make sure you're connected to Celo Alfajores testnet
4. Check contract address is correct: `0x043F679987b6B0c749FBC79B8e56AC8Ed03bc7cF`

---

## 📞 Quick Reference:

**Contract:** `0x043F679987b6B0c749FBC79B8e56AC8Ed03bc7cF`  
**Your Wallet:** `0xe8d5f6956535eaf96d1bc15dd7a9289203de26cb`  
**Network:** Celo Alfajores Testnet  
**Script:** `grant-role-quick.js`  

**Command:**
```powershell
node grant-role-quick.js YOUR_ADMIN_PRIVATE_KEY
```

---

**After granting the role, refresh your dashboard and you'll be able to verify farmers! 🎉**
