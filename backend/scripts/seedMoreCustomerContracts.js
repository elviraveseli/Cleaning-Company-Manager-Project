const mongoose = require('mongoose');
const CustomerContract = require('../models/CustomerContract');
const Customer = require('../models/Customer');
const Object = require('../models/Object');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cleaning-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const generateTimeSlots = () => {
  const slots = [];
  const startHours = [8, 9, 10, 13, 14, 15];
  const duration = Math.floor(Math.random() * 3) + 2; // 2-4 hours

  const startHour = startHours[Math.floor(Math.random() * startHours.length)];
  const endHour = startHour + duration;

  slots.push({
    from: `${String(startHour).padStart(2, '0')}:00`,
    to: `${String(endHour).padStart(2, '0')}:00`,
    duration: duration
  });

  return slots;
};

const generateWorkingDays = () => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const numberOfDays = Math.floor(Math.random() * 3) + 2; // 2-4 days
  const selectedDays = [];
  
  while (selectedDays.length < numberOfDays) {
    const day = days[Math.floor(Math.random() * 5)]; // Mainly weekdays
    if (!selectedDays.find(d => d.day === day)) {
      selectedDays.push({
        day,
        timeSlots: generateTimeSlots()
      });
    }
  }

  return selectedDays;
};

const generateServices = () => {
  const serviceTypes = [
    { name: 'General Cleaning', basePrice: 50 },
    { name: 'Deep Cleaning', basePrice: 100 },
    { name: 'Window Cleaning', basePrice: 30 },
    { name: 'Floor Maintenance', basePrice: 40 },
    { name: 'Sanitization', basePrice: 60 },
    { name: 'Post-Construction Cleaning', basePrice: 150 }
  ];

  const frequencies = ['Daily', 'Weekly', 'Bi-weekly', 'Monthly', 'As Needed'];
  const numberOfServices = Math.floor(Math.random() * 3) + 1; // 1-3 services
  const services = [];

  for (let i = 0; i < numberOfServices; i++) {
    const service = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
    services.push({
      name: service.name,
      description: `Professional ${service.name.toLowerCase()} service`,
      frequency: frequencies[Math.floor(Math.random() * frequencies.length)],
      price: service.basePrice + Math.floor(Math.random() * 50) // Add some price variation
    });
  }

  return services;
};

const generateContract = async (index) => {
  // Get random customer and their objects
  const customers = await Customer.find({}, '_id email firstName lastName phone address');
  if (customers.length === 0) {
    throw new Error('No customers found in the database. Please seed customers first.');
  }
  const randomCustomer = customers[Math.floor(Math.random() * customers.length)];

  // Get objects for this customer
  const objects = await Object.find({ customerId: randomCustomer._id }, '_id');

  const contractTypes = ['One-time', 'Recurring', 'Long-term', 'Emergency'];
  const billingFrequencies = ['Weekly', 'Bi-weekly', 'Monthly', 'Quarterly', 'Annually'];
  const paymentTerms = ['Within 10 days', 'Within 20 days', 'Within 30 days', 'Within 45 days', 'Immediate Payment', 'In advance'];
  const statuses = ['Active', 'Pending', 'Suspended'];

  const services = generateServices();
  const totalAmount = services.reduce((sum, service) => sum + service.price, 0);
  const workingDaysAndTimes = generateWorkingDays();

  // Calculate total hours per engagement
  const totalHoursPerEngagement = workingDaysAndTimes.reduce((sum, day) => {
    return sum + day.timeSlots.reduce((daySum, slot) => daySum + slot.duration, 0);
  }, 0);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30)); // Start within next 30 days

  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + Math.floor(Math.random() * 12) + 1); // 1-12 months duration

  return {
    contractNumber: `KOS-${new Date().getFullYear()}-${String(index + 1000).padStart(4, '0')}`,
    customerId: randomCustomer._id,
    objectId: objects.length > 0 ? objects[Math.floor(Math.random() * objects.length)]._id : undefined,
    objects: objects.map(obj => obj._id),
    customer: {
      name: `${randomCustomer.firstName} ${randomCustomer.lastName}`,
      email: randomCustomer.email,
      phone: randomCustomer.phone,
      address: {
        street: randomCustomer.address,
        city: randomCustomer.city,
        municipality: randomCustomer.municipality,
        country: 'Kosovo'
      }
    },
    billingAddress: {
      sameAsService: true,
      address: randomCustomer.address,
      city: randomCustomer.city,
      municipality: randomCustomer.municipality,
      country: 'Kosovo'
    },
    startDate,
    endDate,
    contractType: contractTypes[Math.floor(Math.random() * contractTypes.length)],
    billingFrequency: billingFrequencies[Math.floor(Math.random() * billingFrequencies.length)],
    totalAmount,
    currency: 'EUR',
    paymentTerms: paymentTerms[Math.floor(Math.random() * paymentTerms.length)],
    paymentCalculation: {
      paymentTermsText: 'Payment due upon invoice receipt',
      paymentMethod: 'Bank Transfer',
      quantityHours: totalHoursPerEngagement,
      hourlyRate: 15,
      totalAmountExcludingVAT: totalAmount,
      vatRate: 8.1,
      vatAmount: totalAmount * 0.081,
      totalAmountIncludingVAT: totalAmount * 1.081,
      rhythmCountByYear: 52, // Weekly rhythm
      totalAnnualizedQuantityHours: totalHoursPerEngagement * 52,
      totalMonthWorkingHours: totalHoursPerEngagement * 4,
      totalAnnualizedContractValue: totalAmount * 52,
      totalMonthlyContractValue: totalAmount * 4,
      employeeHoursPerEngagement: totalHoursPerEngagement / 2, // Assuming 2 employees
      numberOfEmployees: 2,
      totalHoursPerEngagement
    },
    services,
    workingDaysAndTimes,
    servicePreferences: {
      keyAccess: Math.random() > 0.5,
      petInstructions: Math.random() > 0.7 ? 'Keep pets in designated area during cleaning' : undefined,
      accessInstructions: 'Contact reception upon arrival',
      specialRequests: Math.random() > 0.7 ? 'Use eco-friendly products only' : undefined
    },
    specialRequirements: Math.random() > 0.5 ? ['Eco-friendly Products', 'Special Equipment'] : [],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    terms: 'Standard cleaning service terms and conditions apply',
    notes: `Contract notes for customer ${randomCustomer.firstName} ${randomCustomer.lastName}`,
    documents: [
      {
        fileName: `contract-${index}.pdf`,
        uploadDate: new Date()
      }
    ]
  };
};

async function seedMoreCustomerContracts() {
  try {
    console.log('🌱 Starting to seed additional customer contracts...');

    // Generate 30 more contracts
    const additionalContracts = await Promise.all(
      Array.from({ length: 30 }, (_, i) => generateContract(i + 6))
    );

    // Insert additional contracts
    const createdContracts = await CustomerContract.insertMany(additionalContracts);
    console.log(`✅ Created ${createdContracts.length} additional customer contracts`);

    // Display created contracts
    createdContracts.forEach((contract, index) => {
      console.log(`📄 Contract ${index + 1}:`);
      console.log(`   Contract Number: ${contract.contractNumber}`);
      console.log(`   Customer: ${contract.customer.name}`);
      console.log(`   Type: ${contract.contractType}`);
      console.log(`   Status: ${contract.status}`);
      console.log(`   Total Amount: €${contract.totalAmount}`);
      console.log(`   Start Date: ${contract.startDate.toLocaleDateString()}`);
      console.log(`   MongoDB ID: ${contract._id}`);
    });

    console.log('🎉 Additional customer contracts seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding additional customer contracts:', error);
    process.exit(1);
  }
}

seedMoreCustomerContracts(); 