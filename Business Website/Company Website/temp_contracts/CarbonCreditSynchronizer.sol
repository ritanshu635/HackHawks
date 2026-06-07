// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./CarbonCreditGovernmentWallet.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title CarbonCreditSynchronizer
 * @dev Synchronizes carbon credit data between Green Ledger India and Carbon Bloom Connect
 * Ensures both platforms show consistent government wallet balances and transaction data
 */
contract CarbonCreditSynchronizer is AccessControl, ReentrancyGuard {
    bytes32 public constant PLATFORM_ROLE = keccak256("PLATFORM_ROLE");
    bytes32 public constant GOVERNMENT_ROLE = keccak256("GOVERNMENT_ROLE");
    
    CarbonCreditGovernmentWallet public governmentWallet;
    
    // Platform identifiers
    enum Platform { GreenLedgerIndia, CarbonBloomConnect }
    
    // Synchronization events
    event BalanceSynchronized(Platform platform, uint256 balance, uint256 timestamp);
    event TransactionSynchronized(string transactionId, Platform sourcePlatform, Platform targetPlatform);
    event FarmerDataSynchronized(address farmer, uint256 totalCredits, Platform platform);
    event CompanyDataSynchronized(address company, uint256 allocatedCredits, Platform platform);
    
    // Mapping to track last synchronization timestamps
    mapping(Platform => uint256) public lastSyncTimestamp;
    mapping(string => bool) public synchronizedTransactions;
    
    // Farmer data structure for synchronization
    struct FarmerData {
        string id;
        string name;
        uint256 landSize;
        uint256 totalCCGenerated;
        uint256 walletBalance;
        string currentCrop;
        bool isVerified;
    }
    
    // Company data structure for synchronization
    struct CompanyData {
        string id;
        string name;
        uint256 requiredCC;
        uint256 allocatedCC;
        uint256 usedCC;
        uint256 walletBalance;
        bool isVerified;
    }
    
    constructor(address _governmentWallet) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(GOVERNMENT_ROLE, msg.sender);
        governmentWallet = CarbonCreditGovernmentWallet(_governmentWallet);
    }
    
    /**
     * @dev Synchronize government wallet balance across platforms
     * This ensures both Green Ledger India (490,196 CC) and Carbon Bloom Connect show the same balance
     */
    function synchronizeGovernmentBalance() external onlyRole(PLATFORM_ROLE) nonReentrant {
        uint256 currentBalance = governmentWallet.getGovernmentBalance();
        
        // Update both platforms with the current balance
        lastSyncTimestamp[Platform.GreenLedgerIndia] = block.timestamp;
        lastSyncTimestamp[Platform.CarbonBloomConnect] = block.timestamp;
        
        emit BalanceSynchronized(Platform.GreenLedgerIndia, currentBalance, block.timestamp);
        emit BalanceSynchronized(Platform.CarbonBloomConnect, currentBalance, block.timestamp);
    }
    
    /**
     * @dev Synchronize farmer data between platforms
     */
    function synchronizeFarmerData(
        FarmerData memory farmerData,
        Platform sourcePlatform
    ) external onlyRole(PLATFORM_ROLE) {
        // Convert farmer ID to address (simplified for demo)
        address farmerAddress = address(uint160(uint256(keccak256(abi.encodePacked(farmerData.id)))));
        
        emit FarmerDataSynchronized(farmerAddress, farmerData.totalCCGenerated, sourcePlatform);
        
        // Trigger synchronization to other platform
        Platform targetPlatform = sourcePlatform == Platform.GreenLedgerIndia 
            ? Platform.CarbonBloomConnect 
            : Platform.GreenLedgerIndia;
            
        emit FarmerDataSynchronized(farmerAddress, farmerData.totalCCGenerated, targetPlatform);
    }
    
    /**
     * @dev Synchronize company data between platforms
     */
    function synchronizeCompanyData(
        CompanyData memory companyData,
        Platform sourcePlatform
    ) external onlyRole(PLATFORM_ROLE) {
        // Convert company ID to address (simplified for demo)
        address companyAddress = address(uint160(uint256(keccak256(abi.encodePacked(companyData.id)))));
        
        emit CompanyDataSynchronized(companyAddress, companyData.allocatedCC, sourcePlatform);
        
        // Trigger synchronization to other platform
        Platform targetPlatform = sourcePlatform == Platform.GreenLedgerIndia 
            ? Platform.CarbonBloomConnect 
            : Platform.GreenLedgerIndia;
            
        emit CompanyDataSynchronized(companyAddress, companyData.allocatedCC, targetPlatform);
    }
    
    /**
     * @dev Synchronize transaction between platforms
     */
    function synchronizeTransaction(
        string memory transactionId,
        Platform sourcePlatform,
        uint256 amount,
        string memory transactionType
    ) external onlyRole(PLATFORM_ROLE) {
        require(!synchronizedTransactions[transactionId], "Transaction already synchronized");
        
        synchronizedTransactions[transactionId] = true;
        
        Platform targetPlatform = sourcePlatform == Platform.GreenLedgerIndia 
            ? Platform.CarbonBloomConnect 
            : Platform.GreenLedgerIndia;
        
        emit TransactionSynchronized(transactionId, sourcePlatform, targetPlatform);
    }
    
    /**
     * @dev Get synchronization status for a platform
     */
    function getSyncStatus(Platform platform) external view returns (uint256 lastSync, bool isRecent) {
        lastSync = lastSyncTimestamp[platform];
        isRecent = (block.timestamp - lastSync) < 300; // 5 minutes
        return (lastSync, isRecent);
    }
    
    /**
     * @dev Force synchronization of government wallet balance to match Green Ledger India
     * This ensures the balance is exactly 490,196 CC as shown in Green Ledger India
     */
    function forceBalanceSync() external onlyRole(GOVERNMENT_ROLE) {
        uint256 targetBalance = 490196 * 10**18; // 490,196 CC in wei
        
        // Adjust government wallet to match target balance
        governmentWallet.adjustGovernmentBalance(targetBalance, "Force sync to match Green Ledger India");
        
        // Update sync timestamps
        lastSyncTimestamp[Platform.GreenLedgerIndia] = block.timestamp;
        lastSyncTimestamp[Platform.CarbonBloomConnect] = block.timestamp;
        
        emit BalanceSynchronized(Platform.GreenLedgerIndia, targetBalance, block.timestamp);
        emit BalanceSynchronized(Platform.CarbonBloomConnect, targetBalance, block.timestamp);
    }
    
    /**
     * @dev Add platform role to an address
     */
    function addPlatform(address platform) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(PLATFORM_ROLE, platform);
    }
    
    /**
     * @dev Remove platform role from an address
     */
    function removePlatform(address platform) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(PLATFORM_ROLE, platform);
    }
}