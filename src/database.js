const mongoose = require('mongoose');

async function connectDatabase() {
  const uri = 'mongodb://utkrusht_user:utkrusht_pass@mongo:27017/utkrusht_multitenant?authSource=utkrusht_multitenant';

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    maxPoolSize: 20,
  });

  console.log('Connected to MongoDB (utkrusht_multitenant)');
}

module.exports = connectDatabase;
