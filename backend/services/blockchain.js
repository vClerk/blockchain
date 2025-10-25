const { ethers } = require('ethers');

class BlockchainService {
  constructor() {
    // Use FetchRequest for better control over RPC calls
    const fetchReq = new ethers.FetchRequest(process.env.BLOCKCHAIN_NETWORK);
    fetchReq.timeout = parseInt(process.env.RPC_TIMEOUT) || 30000;
    fetchReq.retryCount = parseInt(process.env.RPC_RETRY_ATTEMPTS) || 3;
    
    this.provider = new ethers.JsonRpcProvider(fetchReq, {
      chainId: 44787,
      name: 'celo-alfajores'
    });
    
    this.contractAddress = process.env.CONTRACT_ADDRESS;
    this.contractABI = [
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
      "event FarmerRegistered(address indexed farmer, string name, string location)",
      "event FarmerVerified(address indexed farmer, address indexed verifier)",
      "event SchemeCreated(uint256 indexed schemeId, string name, uint256 amount, address creator)",
      "event SubsidyPaid(uint256 indexed paymentId, uint256 indexed schemeId, address indexed farmer, uint256 amount)"
    ];
    
    if (this.contractAddress) {
      this.contract = new ethers.Contract(this.contractAddress, this.contractABI, this.provider);
    }
  }

  async getWallet(privateKey) {
    return new ethers.Wallet(privateKey, this.provider);
  }

  async getContractWithSigner(privateKey) {
    const wallet = await this.getWallet(privateKey);
    return new ethers.Contract(this.contractAddress, this.contractABI, wallet);
  }

  async getFarmer(address) {
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

  async getScheme(schemeId) {
    try {
      console.log(`📖 Reading scheme ${schemeId} from blockchain...`);
      const scheme = await this.contract.getScheme(schemeId);
      
      const schemeData = {
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
      
      console.log(`✅ Scheme ${schemeId} from blockchain - isActive: ${schemeData.isActive}`);
      return schemeData;
    } catch (error) {
      throw new Error(`Failed to get scheme: ${error.message}`);
    }
  }

  async getPayment(paymentId) {
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

  async getFarmerPayments(address) {
    try {
      const paymentIds = await this.contract.getFarmerPayments(address);
      return paymentIds.map(id => id.toString());
    } catch (error) {
      throw new Error(`Failed to get farmer payments: ${error.message}`);
    }
  }

  async getSchemeBeneficiaries(schemeId) {
    try {
      return await this.contract.getSchemeBeneficiaries(schemeId);
    } catch (error) {
      throw new Error(`Failed to get scheme beneficiaries: ${error.message}`);
    }
  }

  async registerFarmer(privateKey, name, location, cropType, farmSize) {
    try {
      const contract = await this.getContractWithSigner(privateKey);
      const tx = await contract.registerFarmer(name, location, cropType, farmSize);
      return await tx.wait();
    } catch (error) {
      throw new Error(`Failed to register farmer: ${error.message}`);
    }
  }

  async verifyFarmer(privateKey, farmerAddress) {
    try {
      const contract = await this.getContractWithSigner(privateKey);
      const tx = await contract.verifyFarmer(farmerAddress);
      return await tx.wait();
    } catch (error) {
      throw new Error(`Failed to verify farmer: ${error.message}`);
    }
  }

  async createSubsidyScheme(privateKey, name, description, amount, maxBeneficiaries, expiryDate) {
    try {
      const contract = await this.getContractWithSigner(privateKey);
      const amountWei = ethers.parseEther(amount.toString());
      const tx = await contract.createSubsidyScheme(name, description, amountWei, maxBeneficiaries, expiryDate);
      return await tx.wait();
    } catch (error) {
      throw new Error(`Failed to create subsidy scheme: ${error.message}`);
    }
  }

  async paySubsidy(privateKey, schemeId, farmerAddress, remarks) {
    try {
      const contract = await this.getContractWithSigner(privateKey);
      const tx = await contract.paySubsidy(schemeId, farmerAddress, remarks);
      return await tx.wait();
    } catch (error) {
      throw new Error(`Failed to pay subsidy: ${error.message}`);
    }
  }

  async depositFunds(privateKey, amount) {
    try {
      const contract = await this.getContractWithSigner(privateKey);
      const amountWei = ethers.parseEther(amount.toString());
      const tx = await contract.depositFunds({ value: amountWei });
      return await tx.wait();
    } catch (error) {
      throw new Error(`Failed to deposit funds: ${error.message}`);
    }
  }

  async getTransactionReceipt(txHash) {
    try {
      return await this.provider.getTransactionReceipt(txHash);
    } catch (error) {
      throw new Error(`Failed to get transaction receipt: ${error.message}`);
    }
  }

  async getBlockNumber() {
    try {
      return await this.provider.getBlockNumber();
    } catch (error) {
      throw new Error(`Failed to get block number: ${error.message}`);
    }
  }
}

module.exports = new BlockchainService();
