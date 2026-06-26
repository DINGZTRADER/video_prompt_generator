require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

// MongoDB Connection Setup
let db = null;
const mongoUrl = process.env.MONGO_URI || 'mongodb://localhost:27017/wachaai';

async function connectDB() {
  try {
    const client = new MongoClient(mongoUrl);
    await client.connect();
    db = client.db();
    console.log('Successfully connected to MongoDB database.');
  } catch (error) {
    console.warn('MongoDB connection failed. Running server in mock DB fallback mode.', error.message);
  }
}

// 1. Generation API Endpoint
app.post('/api/generate', (req, res) => {
  const { request_id, user_id, project_name, engine_config, asset_context, shot_parameters } = req.body;

  if (!request_id || !user_id || !shot_parameters) {
    return res.status(400).json({ error: 'Missing required parameters.' });
  }

  console.log(`[API Generate] Received generation request ${request_id} for user ${user_id}`);
  console.log(`[API Generate] Project: ${project_name}, Model: ${engine_config.model}`);

  // In production, you would invoke the external Omni-Video rendering service here.
  // We simulate the rendering delay and callback using setTimeout to fire the webhook.
  const webhookUrl = `http://localhost:${PORT}/api/webhooks/video-ready`;
  
  setTimeout(async () => {
    try {
      console.log(`[Simulation] Rendering complete for request ${request_id}. Dispatching webhook...`);
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id,
          user_id,
          shot_number: shot_parameters.shot_number,
          video_url: `https://assets.wachaai.com/rendered/${request_id}_shot_${shot_parameters.shot_number}.mp4`,
          status: 'completed'
        })
      });
      console.log(`[Simulation] Webhook dispatched. Status response: ${response.status}`);
    } catch (err) {
      console.error(`[Simulation] Error dispatching webhook:`, err.message);
    }
  }, 5000); // 5 seconds simulate rendering latency

  res.status(202).json({
    message: 'Generation request accepted. Rendering has started in the background.',
    request_id,
    status: 'rendering'
  });
});

// 2. Webhook Listener Endpoint
app.post('/api/webhooks/video-ready', async (req, res) => {
  const { request_id, user_id, shot_number, video_url, status } = req.body;

  if (!request_id || !user_id || !video_url) {
    return res.status(400).json({ error: 'Invalid webhook payload.' });
  }

  console.log(`[Webhook] Video ready event received for request ${request_id}`);
  console.log(`[Webhook] User: ${user_id}, Shot: ${shot_number}, URL: ${video_url}`);

  try {
    if (db) {
      // Perform Database Sync to user library schema
      const result = await db.collection('user_assets').updateOne(
        { userId: user_id },
        { 
          $push: { 
            clips: { 
              request_id,
              shot: shot_number, 
              url: video_url, 
              status: status || 'completed',
              updatedAt: new Date()
            } 
          } 
        },
        { upsert: true }
      );
      console.log('[Database] Document synced in database.');
      return res.status(200).json({ message: 'Success', db_result: result });
    } else {
      console.log('[Database/Mock] DB is inactive. Mock update logged to console.');
      return res.status(200).json({ 
        message: 'Success (Mock Mode)', 
        sync_payload: { user_id, request_id, shot_number, video_url } 
      });
    }
  } catch (error) {
    console.error('[Webhook Error] Sync failed:', error);
    return res.status(500).json({ error: 'Database sync failed.' });
  }
});

// Start application
app.listen(PORT, async () => {
  console.log(`Veo Director Server running on http://localhost:${PORT}`);
  await connectDB();
});
