const mongoose = require('mongoose');

/**
 * Connects to MongoDB database using the MONGO_URI environment variable.
 * Logs host details on success or exits process on failure.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    // Exit process with failure code if unable to establish database connection
    process.exit(1);
  }
};

module.exports = connectDB;
