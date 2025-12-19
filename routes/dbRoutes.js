const express = require('express');
const router = express.Router();
const { MongoClient, ServerApiVersion } = require('mongodb');

// GET /api/db/ping
router.get('/ping', async (req, res) => {
  const uri = process.env.MONGO_URI;
  if (!uri) return res.status(500).json({ ok: false, message: 'MONGO_URI not configured' });
  if (uri.includes('<') || uri.includes('>')) return res.status(500).json({ ok: false, message: 'MONGO_URI contains placeholder; replace <password>' });

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  try {
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    res.json({ ok: true, message: 'Ping successful' });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Ping failed', error: err.message });
  } finally {
    await client.close();
  }
});

module.exports = router;
