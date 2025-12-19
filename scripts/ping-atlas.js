require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error('MONGO_URI is not set in .env. Please add your Atlas connection string.');
  process.exit(1);
}

if (uri.includes('<') || uri.includes('>')) {
  console.error('Your MONGO_URI appears to contain a placeholder like <password>. Replace it with your actual password (URL-encode special characters).');
  console.error('Current MONGO_URI:', uri);
  process.exit(1);
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    console.log('Pinged your deployment. You successfully connected to MongoDB!');
  } catch (err) {
    console.error('Failed to connect/ping MongoDB:');
    console.error(err.message || err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
