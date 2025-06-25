const mongoose = require('mongoose');
const Object = require('../models/Object');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cleaning-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function seedObjects() {
  try {
    console.log('🌱 Starting to seed objects...');

    // Clear existing objects
    await Object.deleteMany({});
    console.log('🗑️ Cleared existing objects');

    // Sample objects
    const sampleObjects = [
      {
        name: 'Downtown Office Building',
        type: 'Office',
        address: {
          street: '123 Business Ave',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        contactPerson: {
          name: 'John Smith',
          phone: '+1-555-0101',
          email: 'john.smith@company.com'
        },
        size: {
          area: 5000,
          unit: 'sqft'
        },
        floors: 3,
        rooms: 25,
        specialRequirements: ['Security Clearance', '24/7 Access'],
        cleaningFrequency: 'Daily',
        estimatedCleaningTime: 4,
        status: 'Active',
        notes: 'High-security building requiring background checks for all cleaning staff.',
        photos: []
      },
      {
        name: 'Luxury Residential Complex',
        type: 'Residential',
        address: {
          street: '456 Park Lane',
          city: 'Beverly Hills',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        },
        contactPerson: {
          name: 'Sarah Johnson',
          phone: '+1-555-0202',
          email: 'sarah.j@luxurycomplex.com'
        },
        size: {
          area: 12000,
          unit: 'sqft'
        },
        floors: 2,
        rooms: 50,
        specialRequirements: ['Eco-friendly Products'],
        cleaningFrequency: 'Bi-weekly',
        estimatedCleaningTime: 8,
        status: 'Active',
        notes: 'Premium residential complex with high-end finishes requiring specialized cleaning products.',
        photos: []
      },
      {
        name: 'Medical Center',
        type: 'Healthcare',
        address: {
          street: '789 Health Street',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60601',
          country: 'USA'
        },
        contactPerson: {
          name: 'Dr. Michael Brown',
          phone: '+1-555-0303',
          email: 'mbrown@medcenter.com'
        },
        size: {
          area: 8000,
          unit: 'sqft'
        },
        floors: 4,
        rooms: 40,
        specialRequirements: ['Special Equipment', 'Hazardous Materials'],
        cleaningFrequency: 'Daily',
        estimatedCleaningTime: 6,
        status: 'Active',
        notes: 'Medical facility requiring specialized sanitization protocols and certified cleaning staff.',
        photos: []
      },
      {
        name: 'Manufacturing Warehouse',
        type: 'Industrial',
        address: {
          street: '321 Industrial Blvd',
          city: 'Detroit',
          state: 'MI',
          zipCode: '48201',
          country: 'USA'
        },
        contactPerson: {
          name: 'Robert Wilson',
          phone: '+1-555-0404',
          email: 'rwilson@manufacturing.com'
        },
        size: {
          area: 25000,
          unit: 'sqft'
        },
        floors: 1,
        rooms: 10,
        specialRequirements: ['Special Equipment'],
        cleaningFrequency: 'Weekly',
        estimatedCleaningTime: 12,
        status: 'Under Maintenance',
        notes: 'Large industrial facility currently undergoing equipment upgrades.',
        photos: []
      },
      {
        name: 'Elementary School',
        type: 'Educational',
        address: {
          street: '555 Education Way',
          city: 'Austin',
          state: 'TX',
          zipCode: '73301',
          country: 'USA'
        },
        contactPerson: {
          name: 'Principal Lisa Davis',
          phone: '+1-555-0505',
          email: 'ldavis@school.edu'
        },
        size: {
          area: 15000,
          unit: 'sqft'
        },
        floors: 2,
        rooms: 30,
        specialRequirements: ['Eco-friendly Products'],
        cleaningFrequency: 'Daily',
        estimatedCleaningTime: 5,
        status: 'Active',
        notes: 'Educational facility requiring child-safe cleaning products and flexible scheduling around school hours.',
        photos: []
      }
    ];

    // Insert sample objects
    const createdObjects = await Object.insertMany(sampleObjects);
    console.log(`✅ Created ${createdObjects.length} objects`);

    // Display created objects
    createdObjects.forEach((object, index) => {
      console.log(`🏢 Object ${index + 1}:`);
      console.log(`   Name: ${object.name}`);
      console.log(`   Type: ${object.type}`);
      console.log(`   City: ${object.address.city}`);
      console.log(`   Status: ${object.status}`);
      console.log(`   MongoDB ID: ${object._id}`);
    });

    console.log('🎉 Objects seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding objects:', error);
    process.exit(1);
  }
}

seedObjects(); 