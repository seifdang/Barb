const mongoose = require('mongoose');
const User = require('./models/User');
const Salon = require('./models/Salon');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Sample work schedule for barbers
const workSchedule = [
  { day: 0, startTime: '09:00', endTime: '18:00', isWorking: false }, // Sunday - closed
  { day: 1, startTime: '09:00', endTime: '18:00', isWorking: true },  // Monday
  { day: 2, startTime: '09:00', endTime: '18:00', isWorking: true },  // Tuesday
  { day: 3, startTime: '09:00', endTime: '18:00', isWorking: true },  // Wednesday
  { day: 4, startTime: '09:00', endTime: '18:00', isWorking: true },  // Thursday
  { day: 5, startTime: '09:00', endTime: '18:00', isWorking: true },  // Friday
  { day: 6, startTime: '09:00', endTime: '14:00', isWorking: true }   // Saturday - half day
];

// Initialize Saidia salon and staff
const initSalon = async () => {
  try {
    console.log('Starting salon initialization...');
    
    // Check if salon already exists
    const existingSalon = await Salon.findOne({ name: 'Saidia Salon' });
    
    if (existingSalon) {
      console.log('Saidia Salon already exists.');
      await mongoose.connection.close();
      return;
    }
    
    // Create manager
    const managerData = {
      name: 'Massek',
      email: 'massek@saidiasalon.com',
      password: 'Massek@2023',
      phone: '+21612345678',
      role: 'manager',
      staffId: 'MGR-MAS1234',
      isActive: true,
      joinDate: new Date(),
      workSchedule
    };
    
    const manager = await User.findOne({ email: managerData.email });
    
    let managerId;
    if (manager) {
      console.log('Manager already exists');
      managerId = manager._id;
    } else {
      const newManager = await User.create(managerData);
      console.log('Manager created:', newManager.name);
      managerId = newManager._id;
    }
    
    // Create barbers
    const barbersData = [
      {
        name: 'Ramzi',
        email: 'ramzi@saidiasalon.com',
        password: 'Ramzi@2023',
        phone: '+21612345679',
        role: 'barber',
        staffId: 'BRB-RAM1234',
        isActive: true,
        joinDate: new Date(),
        specialties: ['Haircut', 'Beard Trim', 'Coloring'],
        skills: {
          barber: true,
          colorist: true,
          extensionsSpecialist: false
        },
        workSchedule
      },
      {
        name: 'Ashref',
        email: 'ashref@saidiasalon.com',
        password: 'Ashref@2023',
        phone: '+21612345680',
        role: 'barber',
        staffId: 'BRB-ASH1234',
        isActive: true,
        joinDate: new Date(),
        specialties: ['Haircut', 'Shaving', 'Beard Design'],
        skills: {
          barber: true,
          colorist: false,
          extensionsSpecialist: false
        },
        workSchedule
      },
      {
        name: 'Marwen',
        email: 'marwen@saidiasalon.com',
        password: 'Marwen@2023',
        phone: '+21612345681',
        role: 'barber',
        staffId: 'BRB-MAR1234',
        isActive: true,
        joinDate: new Date(),
        specialties: ['Haircut', 'Beard Trim', 'Hair Treatment'],
        skills: {
          barber: true,
          colorist: false,
          extensionsSpecialist: true
        },
        workSchedule
      }
    ];
    
    // Create or find barbers
    const barberIds = [];
    for (const barberData of barbersData) {
      const existingBarber = await User.findOne({ email: barberData.email });
      
      if (existingBarber) {
        console.log(`Barber ${barberData.name} already exists`);
        barberIds.push(existingBarber._id);
      } else {
        const newBarber = await User.create(barberData);
        console.log(`Barber created: ${newBarber.name}`);
        barberIds.push(newBarber._id);
      }
    }
    
    // Create salon
    const salonData = {
      name: 'Saidia Salon',
      address: {
        street: '123 Main Street',
        city: 'Saidia City',
        state: 'Tunisia',
        postalCode: '12345'
      },
      location: {
        type: 'Point',
        coordinates: [10.1815, 36.8065] // Tunis coordinates
      },
      phone: '+21612345678',
      email: 'info@saidiasalon.com',
      description: 'The best barber shop in town with professional service',
      operatingHours: [
        { day: 0, open: '00:00', close: '00:00', isClosed: true },  // Sunday - closed
        { day: 1, open: '09:00', close: '18:00', isClosed: false }, // Monday
        { day: 2, open: '09:00', close: '18:00', isClosed: false }, // Tuesday
        { day: 3, open: '09:00', close: '18:00', isClosed: false }, // Wednesday
        { day: 4, open: '09:00', close: '18:00', isClosed: false }, // Thursday
        { day: 5, open: '09:00', close: '18:00', isClosed: false }, // Friday
        { day: 6, open: '09:00', close: '14:00', isClosed: false }  // Saturday
      ],
      staff: barberIds,
      managers: [managerId],
      isActive: true
    };
    
    const newSalon = await Salon.create(salonData);
    console.log('Salon created:', newSalon.name);
    
    // Update manager's managed locations
    await User.findByIdAndUpdate(managerId, {
      $push: { managedLocations: newSalon._id }
    });
    
    console.log('Salon initialization complete!');
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('Error initializing salon:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the initialization
initSalon(); 