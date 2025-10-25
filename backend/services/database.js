const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database in the backend directory
const dbPath = path.join(__dirname, '..', 'blockchain.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database at:', dbPath);
  }
});

// Initialize database tables
db.serialize(() => {
  // Farmers table
  db.run(`
    CREATE TABLE IF NOT EXISTS farmers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      address TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      cropType TEXT NOT NULL,
      farmSize INTEGER NOT NULL,
      isVerified INTEGER DEFAULT 0,
      registeredAt INTEGER NOT NULL,
      registrationTxHash TEXT,
      createdAt INTEGER DEFAULT (strftime('%s', 'now')),
      updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Schemes table
  db.run(`
    CREATE TABLE IF NOT EXISTS schemes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schemeId INTEGER UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      maxBeneficiaries INTEGER NOT NULL,
      expiryDate INTEGER NOT NULL,
      transactionHash TEXT,
      createdAt INTEGER DEFAULT (strftime('%s', 'now')),
      updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Payments table
  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmerAddress TEXT NOT NULL,
      schemeId INTEGER NOT NULL,
      amount REAL NOT NULL,
      timestamp INTEGER NOT NULL,
      transactionHash TEXT,
      remarks TEXT,
      createdAt INTEGER DEFAULT (strftime('%s', 'now')),
      updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  console.log('📊 Database tables initialized');
});

// Database operations
const database = {
  // Save farmer
  saveFarmer: (farmerData) => {
    return new Promise((resolve, reject) => {
      const { address, name, location, cropType, farmSize, isVerified, registeredAt, registrationTxHash } = farmerData;
      
      const sql = `
        INSERT OR REPLACE INTO farmers (address, name, location, cropType, farmSize, isVerified, registeredAt, registrationTxHash, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
      `;
      
      db.run(sql, [address, name, location, cropType, farmSize, isVerified ? 1 : 0, registeredAt, registrationTxHash], function(err) {
        if (err) {
          console.error('❌ Error saving farmer:', err.message);
          reject(err);
        } else {
          console.log(`✅ Farmer saved to database: ${name} (${address})`);
          resolve({ id: this.lastID, ...farmerData });
        }
      });
    });
  },

  // Find farmer by address
  findFarmerByAddress: (address) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM farmers WHERE LOWER(address) = LOWER(?)', [address], (err, row) => {
        if (err) {
          reject(err);
        } else {
          if (row) {
            row.isVerified = Boolean(row.isVerified);
          }
          resolve(row || null);
        }
      });
    });
  },

  // Find all farmers
  findAllFarmers: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM farmers ORDER BY registeredAt DESC', [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const farmers = rows.map(row => ({
            ...row,
            isVerified: Boolean(row.isVerified)
          }));
          resolve(farmers);
        }
      });
    });
  },

  // Save scheme
  saveScheme: (schemeData) => {
    return new Promise((resolve, reject) => {
      const { schemeId, name, description, amount, maxBeneficiaries, expiryDate, transactionHash } = schemeData;
      
      const sql = `
        INSERT OR REPLACE INTO schemes (schemeId, name, description, amount, maxBeneficiaries, expiryDate, transactionHash, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
      `;
      
      db.run(sql, [schemeId, name, description, amount, maxBeneficiaries, expiryDate, transactionHash], function(err) {
        if (err) {
          console.error('❌ Error saving scheme:', err.message);
          reject(err);
        } else {
          console.log(`✅ Scheme saved to database: ${name} (ID: ${schemeId})`);
          resolve({ id: this.lastID, ...schemeData });
        }
      });
    });
  },

  // Find scheme by ID
  findSchemeById: (schemeId) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM schemes WHERE schemeId = ?', [schemeId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  },

  // Find all schemes
  findAllSchemes: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM schemes ORDER BY createdAt DESC', [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  },

  // Delete scheme by ID
  deleteScheme: (schemeId) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM schemes WHERE schemeId = ?', [schemeId], function(err) {
        if (err) {
          console.error('❌ Error deleting scheme:', err.message);
          reject(err);
        } else {
          console.log(`✅ Scheme ${schemeId} deleted from database`);
          resolve({ deleted: this.changes });
        }
      });
    });
  },

  // Save payment
  savePayment: (paymentData) => {
    return new Promise((resolve, reject) => {
      const { farmerAddress, schemeId, amount, timestamp, transactionHash, remarks } = paymentData;
      
      const sql = `
        INSERT INTO payments (farmerAddress, schemeId, amount, timestamp, transactionHash, remarks)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      db.run(sql, [farmerAddress, schemeId, amount, timestamp, transactionHash, remarks], function(err) {
        if (err) {
          console.error('❌ Error saving payment:', err.message);
          reject(err);
        } else {
          console.log(`✅ Payment saved to database: ${amount} to ${farmerAddress}`);
          resolve({ id: this.lastID, ...paymentData });
        }
      });
    });
  },

  // Find all payments
  findAllPayments: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM payments ORDER BY timestamp DESC', [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  },

  // Get statistics
  getStats: () => {
    return new Promise((resolve, reject) => {
      const queries = [
        'SELECT COUNT(*) as totalFarmers FROM farmers',
        'SELECT COUNT(*) as verifiedFarmers FROM farmers WHERE isVerified = 1',
        'SELECT COUNT(*) as totalSchemes FROM schemes',
        'SELECT COUNT(*) as totalPayments FROM payments'
      ];

      Promise.all(queries.map(query => 
        new Promise((res, rej) => {
          db.get(query, [], (err, row) => {
            if (err) rej(err);
            else res(row);
          });
        })
      )).then(results => {
        resolve({
          totalFarmers: results[0].totalFarmers,
          verifiedFarmers: results[1].verifiedFarmers,
          totalSchemes: results[2].totalSchemes,
          totalPayments: results[3].totalPayments
        });
      }).catch(reject);
    });
  },

  // Close database connection
  close: () => {
    return new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('📕 Database connection closed');
          resolve();
        }
      });
    });
  }
};

module.exports = database;
