// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title SmartSubsidy
 * @dev Smart contract for transparent subsidy distribution to farmers
 */
contract SmartSubsidy is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant GOVERNMENT_ROLE = keccak256("GOVERNMENT_ROLE");
    bytes32 public constant NGO_ROLE = keccak256("NGO_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    struct Farmer {
        string name;
        string location;
        string cropType;
        uint256 farmSize;
        bool isVerified;
        bool isActive;
        uint256 registrationDate;
        uint256 totalSubsidyReceived;
    }

    struct SubsidyScheme {
        string name;
        string description;
        uint256 amount;
        uint256 maxBeneficiaries;
        uint256 currentBeneficiaries;
        bool isActive;
        address creator;
        uint256 creationDate;
        uint256 expiryDate;
    }

    struct Payment {
        uint256 schemeId;
        address farmer;
        uint256 amount;
        uint256 timestamp;
        address approver;
        string remarks;
        bool isCompleted;
    }

    mapping(address => Farmer) public farmers;
    mapping(uint256 => SubsidyScheme) public subsidySchemes;
    mapping(uint256 => Payment) public payments;
    mapping(address => uint256[]) public farmerPayments;
    mapping(uint256 => address[]) public schemeBeneficiaries;

    uint256 public nextSchemeId = 1;
    uint256 public nextPaymentId = 1;
    uint256 public totalFarmersRegistered;
    uint256 public totalSubsidyDistributed;

    event FarmerRegistered(address indexed farmer, string name, string location);
    event FarmerVerified(address indexed farmer, address indexed verifier);
    event SchemeCreated(uint256 indexed schemeId, string name, uint256 amount, address creator);
    event SubsidyPaid(uint256 indexed paymentId, uint256 indexed schemeId, address indexed farmer, uint256 amount);
    event SchemeStatusChanged(uint256 indexed schemeId, bool isActive);
    event FundsDeposited(address indexed depositor, uint256 amount);
    event FundsWithdrawn(address indexed withdrawer, uint256 amount);

    modifier onlyVerifiedFarmer() {
        require(farmers[msg.sender].isVerified && farmers[msg.sender].isActive, "Not a verified farmer");
        _;
    }

    modifier validScheme(uint256 schemeId) {
        require(schemeId > 0 && schemeId < nextSchemeId, "Invalid scheme ID");
        require(subsidySchemes[schemeId].isActive, "Scheme is not active");
        _;
    }

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(GOVERNMENT_ROLE, msg.sender);
    }

    /**
     * @dev Register a new farmer
     */
    function registerFarmer(
        string memory _name,
        string memory _location,
        string memory _cropType,
        uint256 _farmSize
    ) external {
        require(!farmers[msg.sender].isActive, "Farmer already registered");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_location).length > 0, "Location cannot be empty");
        require(_farmSize > 0, "Farm size must be greater than 0");

        farmers[msg.sender] = Farmer({
            name: _name,
            location: _location,
            cropType: _cropType,
            farmSize: _farmSize,
            isVerified: false,
            isActive: true,
            registrationDate: block.timestamp,
            totalSubsidyReceived: 0
        });

        totalFarmersRegistered++;
        emit FarmerRegistered(msg.sender, _name, _location);
    }

    /**
     * @dev Verify a farmer (only government/NGO)
     */
    function verifyFarmer(address farmerAddress) 
        external 
        onlyRole(GOVERNMENT_ROLE) 
    {
        require(farmers[farmerAddress].isActive, "Farmer not found");
        require(!farmers[farmerAddress].isVerified, "Farmer already verified");

        farmers[farmerAddress].isVerified = true;
        emit FarmerVerified(farmerAddress, msg.sender);
    }

    /**
     * @dev Create a new subsidy scheme
     */
    function createSubsidyScheme(
        string memory _name,
        string memory _description,
        uint256 _amount,
        uint256 _maxBeneficiaries,
        uint256 _expiryDate
    ) external onlyRole(GOVERNMENT_ROLE) {
        require(bytes(_name).length > 0, "Scheme name cannot be empty");
        require(_amount > 0, "Amount must be greater than 0");
        require(_maxBeneficiaries > 0, "Max beneficiaries must be greater than 0");
        require(_expiryDate > block.timestamp, "Expiry date must be in the future");

        subsidySchemes[nextSchemeId] = SubsidyScheme({
            name: _name,
            description: _description,
            amount: _amount,
            maxBeneficiaries: _maxBeneficiaries,
            currentBeneficiaries: 0,
            isActive: true,
            creator: msg.sender,
            creationDate: block.timestamp,
            expiryDate: _expiryDate
        });

        emit SchemeCreated(nextSchemeId, _name, _amount, msg.sender);
        nextSchemeId++;
    }

    /**
     * @dev Pay subsidy to a farmer
     */
    function paySubsidy(
        uint256 _schemeId,
        address _farmer,
        string memory _remarks
    ) external onlyRole(GOVERNMENT_ROLE) validScheme(_schemeId) nonReentrant {
        require(farmers[_farmer].isVerified, "Farmer not verified");
        require(
            subsidySchemes[_schemeId].currentBeneficiaries < subsidySchemes[_schemeId].maxBeneficiaries,
            "Scheme beneficiary limit reached"
        );
        require(block.timestamp <= subsidySchemes[_schemeId].expiryDate, "Scheme expired");

        uint256 amount = subsidySchemes[_schemeId].amount;
        require(address(this).balance >= amount, "Insufficient contract balance");

        // Check if farmer already received from this scheme
        address[] memory beneficiaries = schemeBeneficiaries[_schemeId];
        for (uint i = 0; i < beneficiaries.length; i++) {
            require(beneficiaries[i] != _farmer, "Farmer already received from this scheme");
        }

        // Create payment record
        payments[nextPaymentId] = Payment({
            schemeId: _schemeId,
            farmer: _farmer,
            amount: amount,
            timestamp: block.timestamp,
            approver: msg.sender,
            remarks: _remarks,
            isCompleted: true
        });

        // Update records
        farmers[_farmer].totalSubsidyReceived += amount;
        subsidySchemes[_schemeId].currentBeneficiaries++;
        totalSubsidyDistributed += amount;
        
        farmerPayments[_farmer].push(nextPaymentId);
        schemeBeneficiaries[_schemeId].push(_farmer);

        // Transfer funds
        payable(_farmer).transfer(amount);

        emit SubsidyPaid(nextPaymentId, _schemeId, _farmer, amount);
        nextPaymentId++;
    }

    /**
     * @dev Deposit funds to contract
     */
    function depositFunds() external payable onlyRole(GOVERNMENT_ROLE) {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        emit FundsDeposited(msg.sender, msg.value);
    }

    /**
     * @dev Withdraw funds from contract
     */
    function withdrawFunds(uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(amount <= address(this).balance, "Insufficient balance");
        payable(msg.sender).transfer(amount);
        emit FundsWithdrawn(msg.sender, amount);
    }

    /**
     * @dev Toggle scheme status
     */
    function toggleSchemeStatus(uint256 _schemeId) external onlyRole(GOVERNMENT_ROLE) {
        require(_schemeId > 0 && _schemeId < nextSchemeId, "Invalid scheme ID");
        subsidySchemes[_schemeId].isActive = !subsidySchemes[_schemeId].isActive;
        emit SchemeStatusChanged(_schemeId, subsidySchemes[_schemeId].isActive);
    }

    /**
     * @dev Get farmer details
     */
    function getFarmer(address farmerAddress) external view returns (Farmer memory) {
        return farmers[farmerAddress];
    }

    /**
     * @dev Get scheme details
     */
    function getScheme(uint256 schemeId) external view returns (SubsidyScheme memory) {
        return subsidySchemes[schemeId];
    }

    /**
     * @dev Get payment details
     */
    function getPayment(uint256 paymentId) external view returns (Payment memory) {
        return payments[paymentId];
    }

    /**
     * @dev Get farmer payment history
     */
    function getFarmerPayments(address farmerAddress) external view returns (uint256[] memory) {
        return farmerPayments[farmerAddress];
    }

    /**
     * @dev Get scheme beneficiaries
     */
    function getSchemeBeneficiaries(uint256 schemeId) external view returns (address[] memory) {
        return schemeBeneficiaries[schemeId];
    }

    /**
     * @dev Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Get total statistics
     */
    function getStatistics() external view returns (
        uint256 totalFarmers,
        uint256 totalSchemes,
        uint256 totalPayments,
        uint256 totalDistributed,
        uint256 contractBalance
    ) {
        return (
            totalFarmersRegistered,
            nextSchemeId - 1,
            nextPaymentId - 1,
            totalSubsidyDistributed,
            address(this).balance
        );
    }

    /**
     * @dev Emergency pause
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Grant government role
     */
    function grantGovernmentRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(GOVERNMENT_ROLE, account);
    }

    /**
     * @dev Grant NGO role
     */
    function grantNGORole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(NGO_ROLE, account);
    }

    /**
     * @dev Grant auditor role
     */
    function grantAuditorRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(AUDITOR_ROLE, account);
    }
}
