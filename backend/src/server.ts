/**
 * @file server.ts
 * @description Express.js server for the PUF (Physically Unclonable Function) simulation system.
 * Provides REST API endpoints for storing and retrieving brand keypairs used in the fake product
 * detection system. Manages MongoDB connections and serves as the backend service for PUF
 * authenticator key management, supporting the frontend's product verification workflow.
 */

import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI || '')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

interface IBrandKeys {
  [brandName: string]: {
    [publicKey: string]: string;
  };
}

const BrandKeysSchema = new mongoose.Schema<IBrandKeys>({
}, { strict: false });

const BrandKeys = mongoose.model<IBrandKeys>('BrandKeys', BrandKeysSchema);

async function ensureBrandKeysDocument() {
  const existing = await BrandKeys.findOne({});
  if (!existing) {
    await new BrandKeys({}).save();
  }
}

app.post('/store-key', async (req: Request, res: Response) => {
  try {
    const { brandName, publicKey, privateKey } = req.body;

    if (!brandName || !publicKey || !privateKey) {
      return res.status(400).json({ error: 'brandName, publicKey, and privateKey are required' });
    }

    await ensureBrandKeysDocument();

    const updateResult = await BrandKeys.updateOne(
      {},
      {
        $set: {
          [`${brandName}.${publicKey}`]: privateKey
        }
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error storing key:', error);
    res.status(500).json({ error: 'Failed to store key' });
  }
});

app.get('/get-key/:brandName/:publicKey', async (req: Request, res: Response) => {
  try {
    const { brandName, publicKey } = req.params;

    const brandKeys = await BrandKeys.findOne({});
    if (!brandKeys) {
      return res.status(404).json({ error: 'No keys found' });
    }

    const privateKey = brandKeys[brandName]?.[publicKey];
    if (!privateKey) {
      return res.status(404).json({ error: 'Key not found' });
    }

    res.json({ privateKey });
  } catch (error) {
    console.error('Error retrieving key:', error);
    res.status(500).json({ error: 'Failed to retrieve key' });
  }
});

app.get('/brands', async (req: Request, res: Response) => {
  try {
    const brandKeys = await BrandKeys.findOne({});
    if (!brandKeys) {
      return res.json([]);
    }

    const brands = Object.keys(brandKeys.toObject()).filter(key => key !== '_id' && key !== '__v');
    res.json(brands);
  } catch (error) {
    console.error('Error retrieving brands:', error);
    res.status(500).json({ error: 'Failed to retrieve brands' });
  }
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 PUF Server running on port ${PORT}`);
  console.log(`📋 API Endpoints:`);
  console.log(`   POST /store-key`);
  console.log(`   GET  /get-key/:brandName/:publicKey`);
  console.log(`   GET  /brands`);
  console.log(`   GET  /health`);
});
