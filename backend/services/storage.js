// In-memory storage for development when MongoDB is not available
class InMemoryStorage {
  constructor() {
    this.farmers = [];
    this.schemes = [];
    this.payments = [];
  }

  // Farmer operations
  saveFarmer(farmerData) {
    const farmer = {
      _id: Date.now().toString() + Math.random(),
      ...farmerData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.farmers.push(farmer);
    console.log('✅ Farmer saved to storage:', farmer.name);
    return farmer;
  }

  findFarmerByAddress(address) {
    return this.farmers.find(f => f.address.toLowerCase() === address.toLowerCase());
  }

  findAllFarmers() {
    return [...this.farmers].sort((a, b) => new Date(b.registeredAt || b.createdAt) - new Date(a.registeredAt || a.createdAt));
  }

  updateFarmer(address, updateData) {
    const index = this.farmers.findIndex(f => f.address.toLowerCase() === address.toLowerCase());
    if (index !== -1) {
      this.farmers[index] = {
        ...this.farmers[index],
        ...updateData,
        updatedAt: new Date()
      };
      console.log('✅ Farmer updated:', this.farmers[index].name);
      return this.farmers[index];
    }
    return null;
  }

  // Scheme operations
  saveScheme(schemeData) {
    const scheme = {
      _id: Date.now().toString() + Math.random(),
      ...schemeData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.schemes.push(scheme);
    console.log('✅ Scheme saved to storage:', scheme.name);
    return scheme;
  }

  findSchemeById(schemeId) {
    return this.schemes.find(s => s.schemeId === schemeId);
  }

  findAllSchemes() {
    return [...this.schemes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  updateScheme(schemeId, updateData) {
    const index = this.schemes.findIndex(s => s.schemeId === schemeId);
    if (index !== -1) {
      this.schemes[index] = {
        ...this.schemes[index],
        ...updateData,
        updatedAt: new Date()
      };
      return this.schemes[index];
    }
    return null;
  }

  // Payment operations
  savePayment(paymentData) {
    const payment = {
      _id: Date.now().toString() + Math.random(),
      ...paymentData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.payments.push(payment);
    console.log('✅ Payment saved to storage:', payment.paymentId);
    return payment;
  }

  findPaymentsByFarmer(farmerAddress) {
    return this.payments.filter(p => p.farmerAddress.toLowerCase() === farmerAddress.toLowerCase());
  }

  findAllPayments() {
    return [...this.payments].sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt));
  }

  // Stats
  getStats() {
    return {
      totalFarmers: this.farmers.length,
      verifiedFarmers: this.farmers.filter(f => f.isVerified).length,
      totalSchemes: this.schemes.length,
      totalPayments: this.payments.length
    };
  }
}

// Create a singleton instance
const storage = new InMemoryStorage();

console.log('📦 In-memory storage initialized (data will persist until server restarts)');

module.exports = storage;
