const mongoose = require('mongoose');
const EmployeeContract = require('../models/EmployeeContract');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cleaning-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function dropContractNumberIndex() {
  try {
    console.log('🔧 Dropping contractNumber index...');
    
    // Drop the contractNumber index
    await EmployeeContract.collection.dropIndex('contractNumber_1');
    console.log('✅ Successfully dropped contractNumber index');
    
    process.exit(0);
  } catch (error) {
    if (error.code === 27 || error.message.includes('index not found')) {
      console.log('ℹ️ Index contractNumber_1 does not exist, nothing to drop');
      process.exit(0);
    } else {
      console.error('❌ Error dropping index:', error);
      process.exit(1);
    }
  }
}

dropContractNumberIndex(); 