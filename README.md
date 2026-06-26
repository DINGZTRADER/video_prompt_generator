# Veo Cinematic Director Board & Backend Engine

This repository hosts the Google Veo 3 Cinematic Prompt Studio generator interface along with a Node.js Express server integrated with MongoDB to support the multi-turn video asset generation loop.

## Key Features

1. **State Persistence**: Current subject, archetype, and shot configs are automatically auto-saved to the browser's `localStorage`.
2. **Saved Blueprints**: Save custom workspace layouts locally to reload them at any time.
3. **Character Library**: Save and load custom character `@Asset` descriptors to preserve visual continuity across generations.
4. **Structured API generation loop**:
   - `/api/generate` to trigger background rendering with the schema payload.
   - `/api/webhooks/video-ready` for async webhook processing.
   - Synchronizes generation status and assets to MongoDB `user_assets` collection.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
Create a `.env` file in the root directory:
```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/wachaai
```

### 3. Run the Server
```bash
npm start
```
The application will be live at `http://localhost:3000`.
