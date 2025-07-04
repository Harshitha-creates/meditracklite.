// Database setup script for local installation
const { initializeDatabase } = require('./server/storage');

console.log('Initializing MediTrack database...');

initializeDatabase()
  .then(() => {
    console.log('✓ Database tables created successfully!');
    console.log('You can now start the application with: npm start');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ Database initialization failed:', error.message);
    console.log('\nPlease check your database connection settings in the .env file');
    process.exit(1);
  });