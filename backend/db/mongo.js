/*a mongodb database was creates to fit the notifications as they dont follow any defined structure and would be difficult to store in a relational database(postgre)*/

const { MongoClient } = require('mongodb');

let client;
let db;

async function connectMongo() {
  client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  db = client.db(process.env.MONGODB_DB_NAME);

  await db.collection('notifications').createIndex({ customer_id: 1, created_at: -1 });
  await db.collection('notifications').createIndex({ customer_id: 1, is_read: 1 });

  console.log('Connected to MongoDB (notifications)');
  return db;
}

function getMongoDb() {
  if (!db) {
    throw new Error('MongoDB not connected yet — connectMongo() must run before any query.');
  }
  return db;
}

module.exports = { connectMongo, getMongoDb };