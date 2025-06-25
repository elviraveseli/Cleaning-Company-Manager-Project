const mongoose = require('mongoose');
const Schedule = require('../models/Schedule');
const Employee = require('../models/Employee');
const Object = require('../models/Object');

async function checkSchedules() {
  try {
    await mongoose.connect('mongodb://localhost:27017/cleaning-management');
    
    const schedules = await Schedule.find()
      .populate('employees.employee', 'firstName lastName')
      .populate('object', 'name');
    
    console.log(`Found ${schedules.length} schedules:`);
    
    schedules.forEach((schedule, index) => {
      const employeeNames = schedule.employees.map(emp => 
        `${emp.employee.firstName} ${emp.employee.lastName} (${emp.role})`
      ).join(', ');
      
      console.log(`${index + 1}. Object: ${schedule.object.name}`);
      console.log(`   Employees: ${employeeNames}`);
      console.log(`   Date: ${schedule.scheduledDate.toDateString()}`);
      console.log(`   Time: ${schedule.startTime} - ${schedule.endTime}`);
      console.log(`   Status: ${schedule.status}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkSchedules(); 