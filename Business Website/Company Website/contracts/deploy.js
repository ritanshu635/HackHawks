const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Carbon Credit Synchronization Contracts to Sepolia...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");
  
  if (balance < ethers.parseEther("0.1")) {
    console.warn("⚠️  Low balance! You may need more Sepolia ETH for deployment.");
  }
  
  // Deploy Government Wallet Contract
  console.log("\n📄 Deploying CarbonCreditGovernmentWallet...");
  const GovernmentWallet = await ethers.getContractFactory("CarbonCreditGovernmentWallet");
  const governmentWallet = await GovernmentWallet.deploy();
  await governmentWallet.waitForDeployment();
  
  const governmentWalletAddress = await governmentWallet.getAddress();
  console.log("✅ CarbonCreditGovernmentWallet deployed to:", governmentWalletAddress);
  
  // Deploy Synchronizer Contract
  console.log("\n📄 Deploying CarbonCreditSynchronizer...");
  const Synchronizer = await ethers.getContractFactory("CarbonCreditSynchronizer");
  const synchronizer = await Synchronizer.deploy(governmentWalletAddress);
  await synchronizer.waitForDeployment();
  
  const synchronizerAddress = await synchronizer.getAddress();
  console.log("✅ CarbonCreditSynchronizer deployed to:", synchronizerAddress);
  
  // Grant roles to synchronizer
  console.log("\n🔐 Setting up roles and permissions...");
  
  // Grant MINTER_ROLE to synchronizer for minting operations
  await governmentWallet.grantRole(
    await governmentWallet.MINTER_ROLE(),
    synchronizerAddress
  );
  console.log("✅ Granted MINTER_ROLE to synchronizer");
  
  // Grant ALLOCATOR_ROLE to synchronizer for allocation operations
  await governmentWallet.grantRole(
    await governmentWallet.ALLOCATOR_ROLE(),
    synchronizerAddress
  );
  console.log("✅ Granted ALLOCATOR_ROLE to synchronizer");
  
  // Set platform addresses (using deployer as placeholder for now)
  await governmentWallet.setPlatformAddresses(
    deployer.address, // Green Ledger India platform
    deployer.address  // Carbon Bloom Connect platform
  );
  console.log("✅ Set platform addresses");
  
  // Force initial balance sync to match Green Ledger India (490,196 CC)
  console.log("\n⚖️  Synchronizing initial balance...");
  await synchronizer.forceBalanceSync();
  console.log("✅ Government wallet balance synchronized to 490,196 CC");
  
  // Verify the balance
  const finalBalance = await governmentWallet.getGovernmentBalance();
  const balanceInCC = ethers.formatEther(finalBalance);
  console.log("🏦 Final government wallet balance:", balanceInCC, "CC");
  
  // Display deployment summary
  console.log("\n🎉 DEPLOYMENT COMPLETE!");
  console.log("=====================================");
  console.log("Government Wallet:", governmentWalletAddress);
  console.log("Synchronizer:", synchronizerAddress);
  console.log("Network: Sepolia Testnet");
  console.log("Government Balance:", balanceInCC, "CC");
  console.log("=====================================");
  
  // Save deployment info
  const deploymentInfo = {
    network: "sepolia",
    governmentWallet: governmentWalletAddress,
    synchronizer: synchronizerAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    governmentBalance: balanceInCC
  };
  
  console.log("\n📝 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  // Verification instructions
  console.log("\n🔍 To verify contracts on Etherscan:");
  console.log(`npx hardhat verify --network sepolia ${governmentWalletAddress}`);
  console.log(`npx hardhat verify --network sepolia ${synchronizerAddress} ${governmentWalletAddress}`);
  
  console.log("\n🌐 View on Sepolia Etherscan:");
  console.log(`Government Wallet: https://sepolia.etherscan.io/address/${governmentWalletAddress}`);
  console.log(`Synchronizer: https://sepolia.etherscan.io/address/${synchronizerAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });