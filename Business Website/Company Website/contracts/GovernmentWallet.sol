// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GovernmentWallet is Ownable {
    IERC20 public carbonCreditToken;
    
    uint256 public governmentBalance;
    uint256 public constant CC_PRICE_ETH = 0.001 ether; // 0.001 ETH per CC for demo
    
    mapping(address => uint256) public companyBalances;
    mapping(address => bool) public authorizedCompanies;
    
    event CreditsAllocated(address indexed company, uint256 amount, string allocationId);
    event CreditsTransferred(address indexed company, uint256 amount, uint256 payment);
    event GovernmentBalanceUpdated(uint256 newBalance, string platform);
    event CompanyAuthorized(address indexed company);
    
    constructor(address _carbonCreditToken, uint256 _initialBalance) Ownable(msg.sender) {
        carbonCreditToken = IERC20(_carbonCreditToken);
        governmentBalance = _initialBalance * 10**18; // Convert to wei
        
        emit GovernmentBalanceUpdated(governmentBalance, "Carbon Bloom Connect");
    }
    
    /**
     * Get government wallet balance
     */
    function getGovernmentBalance() external view returns (uint256) {
        return governmentBalance;
    }
    
    /**
     * Authorize a company to purchase credits
     */
    function authorizeCompany(address company) external onlyOwner {
        authorizedCompanies[company] = true;
        emit CompanyAuthorized(company);
    }
    
    /**
     * Allocate credits to a company (government action)
     */
    function allocateCreditsToCompany(
        address company, 
        uint256 amount, 
        string memory allocationId
    ) external onlyOwner {
        require(amount <= governmentBalance, "Insufficient government credits");
        require(authorizedCompanies[company], "Company not authorized");
        
        // Reserve credits for the company
        companyBalances[company] += amount;
        
        emit CreditsAllocated(company, amount, allocationId);
    }
    
    /**
     * Transfer credits to company after payment
     */
    function transferCreditsToCompany(address company, uint256 amount) 
        external 
        payable 
    {
        require(authorizedCompanies[company] || company == msg.sender, "Not authorized");
        require(amount <= governmentBalance, "Insufficient government credits");
        require(msg.value >= amount * CC_PRICE_ETH / 10**18, "Insufficient payment");
        
        // Transfer credits
        governmentBalance -= amount;
        
        // Transfer carbon credit tokens to company (if token contract exists)
        if (address(carbonCreditToken) != address(0)) {
            require(
                carbonCreditToken.transfer(company, amount),
                "Token transfer failed"
            );
        }
        
        emit CreditsTransferred(company, amount, msg.value);
        emit GovernmentBalanceUpdated(governmentBalance, "Carbon Bloom Connect");
    }
    
    /**
     * Emergency function to update government balance (for synchronization)
     */
    function updateGovernmentBalance(uint256 newBalance) external onlyOwner {
        governmentBalance = newBalance;
        emit GovernmentBalanceUpdated(governmentBalance, "Carbon Bloom Connect");
    }
    
    /**
     * Withdraw ETH payments (government only)
     */
    function withdrawPayments() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No payments to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * Get company's allocated balance
     */
    function getCompanyBalance(address company) external view returns (uint256) {
        return companyBalances[company];
    }
    
    /**
     * Check if company is authorized
     */
    function isCompanyAuthorized(address company) external view returns (bool) {
        return authorizedCompanies[company];
    }
}