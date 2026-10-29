const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri || uri === 'your_mongodb_atlas_connection_string_here') {
    console.warn('\n⚠️  [MongoDB Warning]: MONGO_URI is not set or still has the placeholder value in server/.env');
    console.warn('👉 Please update server/.env with your actual MongoDB Atlas connection string.\n');
    return false;
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ [MongoDB Connected]: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`❌ [MongoDB Connection Error]: ${error.message}`);
    return false;
  }
};

module.exports = connectDB;
