const mongoose = require('mongoose');
const Object = require('../models/Object');
const Customer = require('../models/Customer');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cleaning-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const generateObject = async (index) => {
  const types = [
    'Office',
    'Residential',
    'Commercial',
    'Industrial',
    'Healthcare',
    'Educational',
    'Government',
    'NGO',
    'Other'
  ];
  const municipalities = [
    'Pristina',
    'Mitrovica',
    'Peja',
    'Prizren',
    'Gjilan',
    'Ferizaj',
    'Gjakova'
  ];
  const statuses = ['Active', 'Inactive', 'Under Maintenance'];
  const specialRequirements = [
    'Eco-friendly Products',
    '24/7 Access',
    'Security Clearance',
    'Special Equipment',
    'Hazardous Materials',
    'EU Standards Compliance'
  ];
  const cleaningFrequencies = ['Daily', 'Weekly', 'Bi-weekly', 'Monthly', 'As Needed'];

  // Get a random customer ID from the database
  const customers = await Customer.find({}, '_id');
  if (customers.length === 0) {
    throw new Error('No customers found in the database. Please seed customers first.');
  }
  const randomCustomer = customers[Math.floor(Math.random() * customers.length)];

  const type = types[Math.floor(Math.random() * types.length)];
  const selectedMunicipality = municipalities[Math.floor(Math.random() * municipalities.length)];
  const isCommercial = ['Office', 'Commercial', 'Industrial', 'Healthcare', 'Educational'].includes(type);
  const size = isCommercial ? 
    Math.floor(Math.random() * 900 + 100) : // 100-1000 m² for commercial
    Math.floor(Math.random() * 150 + 50);   // 50-200 m² for residential

  return {
    customerId: randomCustomer._id,
    name: `${type} ${index}`,
    type,
    address: {
      street: `${Math.floor(Math.random() * 999 + 1)} ${['Main', 'Oak', 'Maple', 'Cedar', 'Pine'][Math.floor(Math.random() * 5)]} Street`,
      city: selectedMunicipality,
      municipality: selectedMunicipality,
      country: 'Kosovo'
    },
    contactPerson: {
      name: `Contact${index}`,
      phone: `+383-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
      email: `contact${index}@example.com`
    },
    size: {
      area: size,
      unit: 'sqm'
    },
    floors: Math.floor(Math.random() * 3) + 1,
    rooms: Math.floor(size / 20), // Rough estimate of rooms based on size
    specialRequirements: Array.from(
      { length: Math.floor(Math.random() * 3) + 1 },
      () => specialRequirements[Math.floor(Math.random() * specialRequirements.length)]
    ),
    cleaningFrequency: cleaningFrequencies[Math.floor(Math.random() * cleaningFrequencies.length)],
    estimatedCleaningTime: Math.floor(size / 50) + 1, // Rough estimate of hours needed
    status: statuses[Math.floor(Math.random() * statuses.length)],
    notes: `Sample notes for ${type} ${index}`,
    photos: Array.from(
      { length: Math.floor(Math.random() * 3) + 1 },
      (_, i) => ({
        fileName: `photo${index}-${i}.jpg`,
        uploadDate: new Date()
      })
    )
  };
};

async function seedMoreObjects() {
  try {
    console.log('🌱 Starting to seed additional objects...');

    // Generate 25 more objects
    const additionalObjects = await Promise.all(
      Array.from({ length: 25 }, (_, i) => generateObject(i + 6))
    );

    // Insert additional objects
    const createdObjects = await Object.insertMany(additionalObjects);
    console.log(`✅ Created ${createdObjects.length} additional objects`);

    // Display created objects
    createdObjects.forEach((object, index) => {
      console.log(`🏢 Object ${index + 1}:`);
      console.log(`   Name: ${object.name}`);
      console.log(`   Type: ${object.type}`);
      console.log(`   Municipality: ${object.address.municipality}`);
      console.log(`   Size: ${object.size.area}m²`);
      console.log(`   Status: ${object.status}`);
      console.log(`   Customer ID: ${object.customerId}`);
      console.log(`   MongoDB ID: ${object._id}`);
    });

    console.log('🎉 Additional objects seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding additional objects:', error);
    process.exit(1);
  }
}

seedMoreObjects(); 