const mongoose = require('mongoose');
const connectDatabase = require('../config/database');
const collegeData = require('../config/colleges.json');

/**
 * Seed script to display available college data
 * In production, this would populate a MongoDB collection
 */
const seedColleges = async () => {
  try {
    await connectDatabase();
    console.log('✅ Connected to MongoDB\n');

    console.log('📚 Available Colleges in Guardian AI:\n');
    console.log('─'.repeat(70));

    collegeData.colleges.forEach((college, index) => {
      console.log(`\n${index + 1}. ${college.name} (${college.code})`);
      console.log(`   Type: ${college.type}`);
      console.log(`   Email Domains: ${college.emailDomains.join(', ')}`);
      console.log(`   Roll Number: ${college.rollNumberExample}`);
      console.log(`   Branches: ${college.branches.slice(0, 4).join(', ')}${college.branches.length > 4 ? '...' : ''}`);
      console.log(`   Max Semester: ${college.maxSemester}`);
    });

    console.log('\n' + '─'.repeat(70));
    console.log(`\nTotal: ${collegeData.colleges.length} colleges`);
    console.log(`Disposable email domains blocked: ${collegeData.disposableEmailDomains.length}\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

seedColleges();
