const mongoose = require('mongoose');
const CustomerContract = require('../models/CustomerContract');
const connectDB = require('../config/database');

const clearCustomerContracts = async () => {
  try {
    await connectDB();
    
    console.log('Dropping customer contracts collection...');
    await CustomerContract.collection.drop();
    console.log('Successfully dropped customer contracts collection');
    
    process.exit(0);
  } catch (error) {
    if (error.message.includes('ns not found')) {
      console.log('Collection does not exist, nothing to drop');
      process.exit(0);
    } else {
      console.error('Error dropping collection:', error);
      process.exit(1);
    }
  }
};

clearCustomerContracts(); 