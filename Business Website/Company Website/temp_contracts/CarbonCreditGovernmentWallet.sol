// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title CarbonCreditGovernmentWallet
 * @dev Unified government wallet for carbon credit management across both platforms
 * This contract manages the government's carbon credit treasury and ensures
 * synchronization between Green Ledger India and Carbon Bloom Connect
 */
contract CarbonCreditGovernmentWallet is ERC20, AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ALLOCATOR_ROLE = keccak256("ALLOCATOR_ROLE");
    bytes32 public constant GOVERNMENT_ROLE = keccak256("GOVERNMENT_ROLE");
    
    // Government wallet balance - should match both platforms
    uint256 public constant INITIAL_GOVERNMENT_BALANCE = 490196 * 10**18; // 490,196 CC
    
    // Platform addresses for synchronization
    address public greenLedgerPlatform;
    address public carbonBloomPlatform;
    
    // Events for cross-platform synchronization
    event GovernmentBalanceUpdated(uint256 newBalance, string platform);
    event CreditsMinted(address indexed farmer, uint256 amount, string projectId);
    event CreditsAllocated(address indexed company, uint256 amount, string allocationId);
    event PlatformSynchronized(string platform, uint256 balance);
    
    // Mapping to track allocations per company
    mapping(address => uint256) public companyAllocations;
    mapping(string => bool) public processedTransactions;
    
    constructor() ERC20("Government Carbon Credit", "GCC") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(GOVERNMENT_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(ALLOCATOR_ROLE, msg.sender);
        
        // Mint initial government balance
        _mint(address(this), INITIAL_GOVERNMENT_BALANCE);
    }
    
    /**
     * @dev Set platform addresses for synchronization
     */
    function setPlatformAddresses(
        address _greenLedgerPlatform,
        address _carbonBloomPlatform
    ) external onlyRole(GOVERNMENT_ROLE) {
        greenLedgerPlatform = _greenLedgerPlatform;
        carbonBloomPlatform = _carbonBloomPlatform;
    }
    
    /**
     * @dev Mint carbon credits for approved projects
     * This function is called when projects are approved and minted
     */
    function mintCarbonCredits(
        address farmer,
        uint256 amount,
        string memory projectId
    ) external onlyRole(MINTER_ROLE) nonReentrant whenNotPaused {
        require(farmer != address(0), "Invalid farmer address");
        require(amount > 0, "Amount must be greater than 0");
        require(!processedTransactions[projectId], "Transaction already processed");
        
        // Mark transaction as processed
        processedTransactions[projectId] = true;
        
        // Mint credits to government wallet
        _mint(address(this), amount);
        
        emit CreditsMinted(farmer, amount, projectId);
        emit GovernmentBalanceUpdated(balanceOf(address(this)), "mint");
    }
    
    /**
     * @dev Allocate carbon credits to companies
     */
    function allocateCreditsToCompany(
        address company,
        uint256 amount,
        string memory allocationId
    ) external onlyRole(ALLOCATOR_ROLE) nonReentrant whenNotPaused {
        require(company != address(0), "Invalid company address");
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(address(this)) >= amount, "Insufficient government balance");
        require(!processedTransactions[allocationId], "Allocation already processed");
        
        // Mark allocation as processed
        processedTransactions[allocationId] = true;
        
        // Transfer credits from government to company
        _transfer(address(this), company, amount);
        
        // Update company allocation tracking
        companyAllocations[company] += amount;
        
        emit CreditsAllocated(company, amount, allocationId);
        emit GovernmentBalanceUpdated(balanceOf(address(this)), "allocation");
    }
    
    /**
     * @dev Get government wallet balance (should match both platforms)
     */
    function getGovernmentBalance() external view returns (uint256) {
        return balanceOf(address(this));
    }
    
    /**
     * @dev Synchronize balance with external platforms
     * This ensures both Green Ledger India and Carbon Bloom Connect show the same balance
     */
    function synchronizeWithPlatforms() external onlyRole(GOVERNMENT_ROLE) {
        uint256 currentBalance = balanceOf(address(this));
        
        emit PlatformSynchronized("GreenLedgerIndia", currentBalance);
        emit PlatformSynchronized("CarbonBloomConnect", currentBalance);
    }
    
    /**
     * @dev Emergency function to adjust government balance if needed
     * This should only be used for critical synchronization issues
     */
    function adjustGovernmentBalance(
        uint256 newBalance,
        string memory reason
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 currentBalance = balanceOf(address(this));
        
        if (newBalance > currentBalance) {
            _mint(address(this), newBalance - currentBalance);
        } else if (newBalance < currentBalance) {
            _burn(address(this), currentBalance - newBalance);
        }
        
        emit GovernmentBalanceUpdated(newBalance, reason);
    }
    
    /**
     * @dev Get company allocation details
     */
    function getCompanyAllocation(address company) external view returns (uint256) {
        return companyAllocations[company];
    }
    
    /**
     * @dev Check if transaction has been processed
     */
    function isTransactionProcessed(string memory transactionId) external view returns (bool) {
        return processedTransactions[transactionId];
    }
    
    /**
     * @dev Pause contract in case of emergency
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Override transfer to add additional checks
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
}