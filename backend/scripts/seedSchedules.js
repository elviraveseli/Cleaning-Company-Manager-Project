const mongoose = require('mongoose');
const Schedule = require('../models/Schedule');
const Employee = require('../models/Employee');
const Object = require('../models/Object');

async function seedSchedules() {
  try {
    await mongoose.connect('mongodb://localhost:27017/cleaning-management');
    console.log('Connected to MongoDB');

    // Get some employees and objects
    const employees = await Employee.find().limit(3);
    const objects = await Object.find().limit(2);

    if (employees.length === 0) {
      console.log('No employees found. Please create employees first.');
      return;
    }

    if (objects.length === 0) {
      console.log('No objects found. Please create objects first.');
      return;
    }

    console.log(`Found ${employees.length} employees and ${objects.length} objects`);

    // Clear existing schedules
    await Schedule.deleteMany({});
    console.log('Cleared existing schedules');

    // Create some test schedules for today and this week
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const schedules = [
      {
        object: objects[0]._id,
        employees: [{ employee: employees[0]._id, role: 'Primary' }],
        scheduledDate: today,
        startTime: '09:00',
        endTime: '12:00',
        estimatedDuration: 3,
        status: 'Scheduled',
        priority: 'Medium',
        cleaningType: 'Regular',
        notes: 'Regular weekly cleaning'
      },
      {
        object: objects[0]._id,
        employees: [{ employee: employees[1]._id, role: 'Primary' }],
        scheduledDate: tomorrow,
        startTime: '14:00',
        endTime: '17:00',
        estimatedDuration: 3,
        status: 'Scheduled',
        priority: 'High',
        cleaningType: 'Deep Clean',
        notes: 'Deep cleaning session'
      }
    ];

    // Add more schedules if we have more objects
    if (objects.length > 1) {
      schedules.push({
        object: objects[1]._id,
        employees: [
          { employee: employees[0]._id, role: 'Primary' },
          { employee: employees[1]._id, role: 'Secondary' }
        ],
        scheduledDate: nextWeek,
        startTime: '10:00',
        endTime: '15:00',
        estimatedDuration: 5,
        status: 'Scheduled',
        priority: 'Medium',
        cleaningType: 'Regular',
        notes: 'Team cleaning for large area'
      });
    }

    // Create schedules
    const createdSchedules = await Schedule.insertMany(schedules);
    console.log(`Created ${createdSchedules.length} test schedules`);

    // Display created schedules
    const populatedSchedules = await Schedule.find()
      .populate('employees.employee', 'firstName lastName')
      .populate('object', 'name');

    console.log('\nCreated schedules:');
    populatedSchedules.forEach(schedule => {
      const employeeNames = schedule.employees.map(emp => 
        `${emp.employee.firstName} ${emp.employee.lastName} (${emp.role})`
      ).join(', ');
      console.log(`- ${schedule.object.name}: ${employeeNames} on ${schedule.scheduledDate.toDateString()} ${schedule.startTime}-${schedule.endTime}`);
    });

    console.log('\nSchedule seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding schedules:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedSchedules(); 