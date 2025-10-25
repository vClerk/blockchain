import { ethers } from 'ethers';

// Smart contract ABI
const SMART_SUBSIDY_ABI = [
  "function registerFarmer(string memory _name, string memory _location, string memory _cropType, uint256 _farmSize) external",
  "function verifyFarmer(address farmerAddress) external",
  "function createSubsidyScheme(string memory _name, string memory _description, uint256 _amount, uint256 _maxBeneficiaries, uint256 _expiryDate) external",
  "function paySubsidy(uint256 _schemeId, address _farmer, string memory _remarks) external",
  "function depositFunds() external payable",
  "function getFarmer(address farmerAddress) external view returns (tuple(string name, string location, string cropType, uint256 farmSize, bool isVerified, bool isActive, uint256 registrationDate, uint256 totalSubsidyReceived))",
  "function getScheme(uint256 schemeId) external view returns (tuple(string name, string description, uint256 amount, uint256 maxBeneficiaries, uint256 currentBeneficiaries, bool isActive, address creator, uint256 creationDate, uint256 expiryDate))",
  "function getPayment(uint256 paymentId) external view returns (tuple(uint256 schemeId, address farmer, uint256 amount, uint256 timestamp, address approver, string remarks, bool isCompleted))",
  "function getFarmerPayments(address farmerAddress) external view returns (uint256[])",
  "function getSchemeBeneficiaries(uint256 schemeId) external view returns (address[])",
  "function getStatistics() external view returns (uint256 totalFarmers, uint256 totalSchemes, uint256 totalPayments, uint256 totalDistributed, uint256 contractBalance)",
  "function getContractBalance() external view returns (uint256)",
  "function grantGovernmentRole(address account) external",
  "function hasRole(bytes32 role, address account) external view returns (bool)",
  "event FarmerRegistered(address indexed farmer, string name, string location)",
  "event FarmerVerified(address indexed farmer, address indexed verifier)",
  "event SchemeCreated(uint256 indexed schemeId, string name, uint256 amount, address creator)",
  "event SubsidyPaid(uint256 indexed paymentId, uint256 indexed schemeId, address indexed farmer, uint256 amount)"
];

// Contract addresses for different networks
const CONTRACT_ADDRESSES = {
  44787: process.env.REACT_APP_CELO_TESTNET_CONTRACT_ADDRESS, // Celo Alfajores Testnet
  42220: process.env.REACT_APP_CELO_MAINNET_CONTRACT_ADDRESS, // Celo Mainnet
  1337: '0x5FbDB2315678afecb367f032d93F642f64180aa3' // Local development
};

class MetaMaskContractService {
  constructor() {
    this.contract = null;
    this.signer = null;
    this.provider = null;
  }

  // Initialize the service with MetaMask provider
  async initialize(provider, signer, chainId) {
    this.provider = provider;
    this.signer = signer;
    
    const contractAddress = CONTRACT_ADDRESSES[chainId];
    if (!contractAddress) {
      throw new Error(`Contract not deployed on network ${chainId}`);
    }

    this.contract = new ethers.Contract(contractAddress, SMART_SUBSIDY_ABI, signer);
    return this.contract;
  }

  // Check if service is initialized
  isInitialized() {
    return !!this.contract && !!this.signer;
  }

  // Farmer operations
  async registerFarmer(name, location, cropType, farmSize) {
    if (!this.isInitialized()) throw new Error('Service not initialized');
    
    try {
      const tx = await this.contract.registerFarmer(name, location, cropType, farmSize);
      const receipt = await tx.wait();
      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      throw new Error(`Failed to register farmer: ${error.message}`);
    }
  }

  async getFarmer(address) {
    if (!this.isInitialized()) throw new Error('Service not initialized');
    
    try {
      const farmer = await this.contract.getFarmer(address);
      return {
        name: farmer.name,
        location: farmer.location,
        cropType: farmer.cropType,
        farmSize: farmer.farmSize.toString(),
        isVerified: farmer.isVerified,
        isActive: farmer.isActive,
        registrationDate: farmer.registrationDate.toString(),
        totalSubsidyReceived: ethers.formatEther(farmer.totalSubsidyReceived)
      };
    } catch (error) {
      throw new Error(`Failed to get farmer: ${error.message}`);
    }
  }

  async getFarmerPayments(address) {
    if (!this.isInitialized()) throw new Error('Service not initialized');
    
    try {
      const paymentIds = await this.contract.getFarmerPayments(address);
      return paymentIds.map(id => id.toString());
    } catch (error) {
      throw new Error(`Failed to get farmer payments: ${error.message}`);
    }
  }

  // Government operations
  async verifyFarmer(farmerAddress) {
    if (!this.isInitialized()) throw new Error('Service not initialized');
    
    try {
      const tx = await this.contract.verifyFarmer(farmerAddress);
      const receipt = await tx.wait();
      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      throw new Error(`Failed to verify farmer: ${error.message}`);
    }
  }

  async createSubsidyScheme(name, description, amount, maxBeneficiaries, expiryDate) {
    if (!this.isInitialized()) throw new Error('Service not initialized');
    
    try {
      const amountWei = ethers.parseEther(amount.toString());
      const tx = await this.contract.createSubsidyScheme(
        name,
        description,
        amountWei,
        maxBeneficiaries,
        expiryDate
      );
      const receipt = await tx.wait();
      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      throw new Error(`Failed to create subsidy scheme: ${error.message}`);
    }
  }

  async paySubsidy(schemeId, farmerAddress, remarks) {
    if (!this.isInitialized()) throw new Error('Service not initialized');
    
    try {
      const tx = await this.contract.paySubsidy(schemeId, farmerAddress, remarks);
      const receipt = await tx.wait();
      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      throw new Error(`Failed to pay subsidy: ${error.message}`);
    }
  }

  async depositFunds(amount) {
    if (!this.isInitialized()) throw new Error('Service not initialized');
    
    try {
      const amountWei = ethers.parseEther(amount.toString());
      const tx = await this.contract.depositFunds({ value: amountWei });
      const receipt = await tx.wait();
      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      throw new Error(`Failed to deposit funds: ${error.message}`);
    }
  }

  // View functions
  async getScheme(schemeId) {
    if (!this.isInitialized()) throw new Error('Service not initialized');
    
    try {
      const scheme = await this.contract.getScheme(schemeId);
      return {
        name: scheme.name,
        description: scheme.description,
        amount: ethers.formatEther(scheme.amount),
        maxBeneficiaries: scheme.maxBeneficiaries.toString(),
        currentBeneficiaries: scheme.currentBeneficiaries.toString(),
        isActive: scheme.isActive,
        creator: scheme.creator,
        creationDate: scheme.creationDate.toString(),
        expiryDate: scheme.expiryDate.toString()
      };
    } catch (error) {
      throw new Error(`Failed to get scheme: ${error.message}`);
    }
  }

  async getPayment(paymentId) {
    if (!this.isInitialized()) throw new Error('Service not initialized');
    
    try {
      const payment = await this.contract.getPayment(paymentId);
      return {
        schemeId: payment.schemeId.toString(),
        farmer: payment.farmer,
        amount: ethers.formatEther(payment.amount),
        timestamp: payment.timestamp.toString(),
        approver: payment.approver,
        remarks: payment.remarks,
        isCompleted: payment.isCompleted
      };
    } catch (error) {
      throw new Error(`Failed to get payment: ${error.message}`);
    }
  }

  async getStatistics() {
    if (!this.isInitialized()) throw new Error('Service not initialized');
    
    try {
      const stats = await this.contract.getStatistics();
      return {
        totalFarmers: stats.totalFarmers.toString(),
        totalSchemes: stats.totalSchemes.toString(),
        totalPayments: stats.totalPayments.toString(),
        totalDistributed: ethers.formatEther(stats.totalDistributed),
        contractBalance: ethers.formatEther(stats.contractBalance)
      };
    } catch (error) {
      throw new Error(`Failed to get statistics: ${error.message}`);
    }
  }

  async getSchemeBeneficiaries(schemeId) {
    if (!this.isInitialized()) throw new Error('Service not initialized');
    
    try {
      return await this.contract.getSchemeBeneficiaries(schemeId);
    } catch (error) {
      throw new Error(`Failed to get scheme beneficiaries: ${error.message}`);
    }
  }

  // Utility functions
  async getBalance(address) {
    if (!this.provider) throw new Error('Provider not available');
    
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  async getBlockNumber() {
    if (!this.provider) throw new Error('Provider not available');
    
    try {
      return await this.provider.getBlockNumber();
    } catch (error) {
      throw new Error(`Failed to get block number: ${error.message}`);
    }
  }

  async getTransactionReceipt(txHash) {
    if (!this.provider) throw new Error('Provider not available');
    
    try {
      return await this.provider.getTransactionReceipt(txHash);
    } catch (error) {
      throw new Error(`Failed to get transaction receipt: ${error.message}`);
    }
  }

  // Check user roles
  async hasGovernmentRole(address) {
    if (!this.isInitialized()) throw new Error('Service not initialized');
    
    try {
      const GOVERNMENT_ROLE = ethers.keccak256(ethers.toUtf8Bytes("GOVERNMENT_ROLE"));
      return await this.contract.hasRole(GOVERNMENT_ROLE, address);
    } catch (error) {
      return false; // Default to false if check fails
    }
  }

  // Listen to events
  onFarmerRegistered(callback) {
    if (!this.contract) return;
    
    this.contract.on("FarmerRegistered", (farmer, name, location, event) => {
      callback({
        farmer,
        name,
        location,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash
      });
    });
  }

  onSubsidyPaid(callback) {
    if (!this.contract) return;
    
    this.contract.on("SubsidyPaid", (paymentId, schemeId, farmer, amount, event) => {
      callback({
        paymentId: paymentId.toString(),
        schemeId: schemeId.toString(),
        farmer,
        amount: ethers.formatEther(amount),
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash
      });
    });
  }

  // Remove event listeners
  removeAllListeners() {
    if (this.contract) {
      this.contract.removeAllListeners();
    }
  }
}

// Export singleton instance
export const metaMaskContractService = new MetaMaskContractService();
export default metaMaskContractService;
