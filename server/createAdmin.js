require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const ADMIN_EMAIL = 'newadmin@campusx.edu';
const ADMIN_PASSWORD = 'Admin@12345';

async function createAdmin() {
    try {
        const mongoUri =
            process.env.MONGODB_URI ||
            process.env.MONGO_URI ||
            'mongodb://localhost:27017/campusx';

        await mongoose.connect(mongoUri);

        console.log('✅ MongoDB connected');

        const existingAdmin = await User.findOne({
            email: ADMIN_EMAIL.toLowerCase(),
        });

        if (existingAdmin) {
            console.log('❌ This email already exists:', ADMIN_EMAIL);
            process.exit(1);
        }

        const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

        const admin = await User.create({
            email: ADMIN_EMAIL,
            passwordHash,

            firstName: 'CampusX',
            lastName: 'Admin',

            rollNumber: 'ADMIN001',
            college: 'CampusX Administration',
            branch: 'Administration',
            semester: 'N/A',

            role: 'admin',
            status: 'active',

            emailVerified: true,
            isVerified: true,

            riskLevel: 'low',
            failedLoginAttempts: 0,
            lockedUntil: null,

            onboardingCompleted: true,
        });

        console.log('\n🎉 NEW ADMIN CREATED SUCCESSFULLY!\n');
        console.log('Email:', admin.email);
        console.log('Password:', ADMIN_PASSWORD);
        console.log('Role:', admin.role);
        console.log('Status:', admin.status);

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
        await mongoose.disconnect();
        process.exit(1);
    }
}

createAdmin();