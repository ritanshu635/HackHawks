const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying New Government Wallet Contract to Sepolia...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");
  
  if (balance < ethers.parseEther("0.01")) {
    console.warn("⚠️  Low balance! You may need more Sepolia ETH for deployment.");
  }
  
  // Use existing Carbon Credit Token from Green Ledger India
  const carbonCreditTokenAddress = "0xED7a9D61091CBFB927aAe5B897d7aebb81E633D7";
  console.log("Using existing Carbon Credit Token:", carbonCreditTokenAddress);
  
  // Deploy New Government Wallet Contract
  console.log("\n📄 Deploying GovernmentWallet...");
  const GovernmentWallet = await ethers.getContractFactory("GovernmentWallet");
  const governmentWallet = await GovernmentWallet.deploy(
    carbonCreditTokenAddress,
    490196 // Initial balance: 490,196 CC
  );
  await governmentWallet.waitForDeployment();
  
  const governmentWalletAddress = await governmentWallet.getAddress();
  console.log("✅ GovernmentWallet deployed to:", governmentWalletAddress);
  
  // Verify the balance
  const initialBalance = await governmentWallet.getGovernmentBalance();
  const balanceInCC = ethers.formatEther(initialBalance);
  console.log("🏦 Initial government wallet balance:", balanceInCC, "CC");
  
  // Display deployment summary
  console.log("\n🎉 DEPLOYMENT COMPLETE!");
  console.log("=====================================");
  console.log("Government Wallet:", governmentWalletAddress);
  console.log("Carbon Credit Token:", carbonCreditTokenAddress);
  console.log("Network: Sepolia Testnet");
  console.log("Government Balance:", balanceInCC, "CC");
  console.log("=====================================");
  
  // Save deployment info
  const deploymentInfo = {
    network: "sepolia",
    governmentWallet: governmentWalletAddress,
    carbonCreditToken: carbonCreditTokenAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    governmentBalance: balanceInCC
  };
  
  console.log("\n📝 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  // Verification instructions
  console.log("\n🔍 To verify contract on Etherscan:");
  console.log(`npx hardhat verify --network sepolia ${governmentWalletAddress} ${carbonCreditTokenAddress} 490196`);
  
  console.log("\n🌐 View on Sepolia Etherscan:");
  console.log(`Government Wallet: https://sepolia.etherscan.io/address/${governmentWalletAddress}`);
  console.log(`Carbon Credit Token: https://sepolia.etherscan.io/address/${carbonCreditTokenAddress}`);
  
  console.log("\n📋 Update your .env file with:");
  console.log(`GOVERNMENT_WALLET_ADDRESS=${governmentWalletAddress}`);
  console.log(`CARBON_CREDIT_TOKEN_ADDRESS=${carbonCreditTokenAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });