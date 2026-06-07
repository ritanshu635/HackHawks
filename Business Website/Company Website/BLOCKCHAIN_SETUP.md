# 🚀 Blockchain Integration Setup Guide

This guide will help you deploy smart contracts on Sepolia testnet and synchronize the government wallet balance between **Green Ledger India** (490,196 CC) and **Carbon Bloom Connect**.

## 📋 Prerequisites

1. **MetaMask Wallet** with Sepolia ETH
2. **Node.js** (v16 or higher)
3. **Sepolia Testnet ETH** (get from [Sepolia Faucet](https://sepoliafaucet.com/))
4. **Infura Account** (for RPC endpoint)
5. **Etherscan API Key** (for contract verification)

## 🔧 Step 1: Environment Setup

1. **Copy environment file:**
```bash
cp .env.example .env
```

2. **Update .env file with your credentials:**
```env
# Blockchain Configuration
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
PRIVATE_KEY=your_private_key_without_0x_prefix
ETHERSCAN_API_KEY=your_etherscan_api_key

# These will be populated after deployment
GOVERNMENT_WALLET_ADDRESS=
SYNCHRONIZER_ADDRESS=
```

## 🏗️ Step 2: Install Dependencies

```bash
# Install Hardhat and dependencies
npm install --save-dev @nomicfoundation/hardhat-toolbox @openzeppelin/contracts hardhat dotenv
npm install ethers@^5.7.2
```

## 📄 Step 3: Deploy Smart Contracts

1. **Compile contracts:**
```bash
npx hardhat compile
```

2. **Deploy to Sepolia:**
```bash
npx hardhat run contracts/deploy.js --network sepolia
```

3. **Save the contract addresses** from the deployment output to your `.env` file.

## 🔄 Step 4: Update Backend Integration

1. **Update your .env file** with the deployed contract addresses:
```env
GOVERNMENT_WALLET_ADDRESS=0x...  # From deployment output
SYNCHRONIZER_ADDRESS=0x...       # From deployment output
```

2. **Restart your backend server:**
```bash
npm run dev
```

## 🎯 Step 5: Verify Synchronization

### Check Government Wallet Balance

The government wallet should now show **490,196 CC** in both platforms:

1. **Green Ledger India**: http://localhost:8082/wallet
2. **Carbon Bloom Connect**: http://localhost:8081/government

### Test Blockchain Integration

1. **Connect MetaMask** to Sepolia testnet
2. **Import the government wallet address** to MetaMask
3. **Check balance** on Etherscan: `https://sepolia.etherscan.io/address/YOUR_GOVERNMENT_WALLET_ADDRESS`

## 🔍 Step 6: Contract Verification

Verify your contracts on Etherscan for transparency:

```bash
npx hardhat verify --network sepolia GOVERNMENT_WALLET_ADDRESS
npx hardhat verify --network sepolia SYNCHRONIZER_ADDRESS GOVERNMENT_WALLET_ADDRESS
```

## 📊 Expected Results

After successful deployment and synchronization:

### ✅ Government Wallet Balance
- **Green Ledger India**: 490,196 CC
- **Carbon Bloom Connect**: 490,196 CC
- **Blockchain (Sepolia)**: 490,196 CC

### ✅ Smart Contract Features
- **Unified Government Wallet**: Single source of truth for CC balance
- **Cross-Platform Sync**: Automatic synchronization between platforms
- **Blockchain Transparency**: All transactions visible on Sepolia Etherscan
- **Role-Based Access**: Government, minter, and allocator roles

### ✅ Integration Points
- **Project Approval**: Mints CC to government wallet
- **Company Allocation**: Transfers CC from government to companies
- **Real-time Sync**: Balance updates propagate to both platforms

## 🛠️ Troubleshooting

### Issue: Low Balance Error
**Solution**: Get more Sepolia ETH from faucet

### Issue: Contract Not Found
**Solution**: Check contract addresses in .env file

### Issue: Balance Mismatch
**Solution**: Run force sync:
```javascript
// In your backend
await blockchainService.synchronizeGovernmentBalance();
```

### Issue: MetaMask Connection
**Solution**: 
1. Switch to Sepolia testnet
2. Import contract addresses
3. Refresh the page

## 🔐 Security Notes

1. **Never commit private keys** to version control
2. **Use environment variables** for sensitive data
3. **Test on Sepolia** before mainnet deployment
4. **Verify contracts** on Etherscan for transparency

## 📈 Monitoring

### Blockchain Explorer
- **Sepolia Etherscan**: https://sepolia.etherscan.io/
- **Government Wallet**: Check your deployed address
- **Transaction History**: Monitor all CC operations

### Platform Dashboards
- **Green Ledger India**: Government wallet page
- **Carbon Bloom Connect**: Government dashboard

## 🎉 Success Criteria

✅ Smart contracts deployed on Sepolia  
✅ Government wallet shows 490,196 CC on both platforms  
✅ Blockchain transactions visible on Etherscan  
✅ Cross-platform synchronization working  
✅ Real-time balance updates  

## 📞 Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify your .env configuration
3. Ensure you have sufficient Sepolia ETH
4. Check contract addresses are correct

---

**🌟 Congratulations!** You now have a fully integrated blockchain-based carbon credit system with synchronized government wallets across both platforms!