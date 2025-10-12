# Provenance Backend Server

A TypeScript server for storing PUF keypairs in MongoDB Atlas for the Provenance System demo.

## Setup

### 1. MongoDB Atlas Setup

1. Create a free MongoDB Atlas account at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a new cluster (free tier is sufficient)
3. Create a database user and get your connection string
4. Your connection string should look like: `mongodb+srv://username:password@cluster.mongodb.net/database`

### 2. Environment Variables

Create a `.env` file in the backend directory:

```bash
# MongoDB Atlas connection string (replace 'YOUR_ACTUAL_PASSWORD' with your real password)
MONGODB_URI=mongodb+srv://username:password@provenance.hnass9j.mongodb.net/?retryWrites=true&w=majority&appName=Provenance

# Server port (optional, defaults to 3001)
PORT=3001

# Frontend URL for CORS (update when deployed)
FRONTEND_URL=http://localhost:5173
```

### 3. Database Schema

The server uses a simple schema: `{brandName: {publicKey: privateKey}}`

Example stored data:
```json
{
  "Aurora Labs": {
    "0xA1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0": "0xabc123def456..."
  }
}
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm run build
npm start
```

## API Endpoints

### POST /store-key
Store a keypair for a brand.

**Request:**
```json
{
  "brandName": "Aurora Labs",
  "publicKey": "0xA1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0",
  "privateKey": "0xabc123def456..."
}
```

**Response:**
```json
{ "success": true }
```

### GET /get-key/:brandName/:publicKey
Retrieve private key by brand name and public key.

**Response:**
```json
{ "privateKey": "0xabc123def456..." }
```

### GET /brands
Get all brand names.

**Response:**
```json
["Aurora Labs", "NovaCraft"]
```

### GET /health
Health check endpoint.

**Response:**
```json
{ "status": "OK", "timestamp": "2024-01-01T12:00:00.000Z" }
```

## Integration with Frontend

The frontend should call these endpoints:

1. **Generate Authenticator**: POST /store-key with the generated keypair
2. **Mint Product**: Use the stored public key as the product authenticator
3. **Verify Product**: GET /get-key/:brandName/:publicKey to retrieve private key for signing

## Security Notes

- Private keys are stored in plain text in MongoDB (for demo purposes)
- In production, you would encrypt the private keys
- The server doesn't perform any authentication - add API keys if needed

## Troubleshooting

- **Connection Error**: Make sure your MongoDB Atlas password is correct in the `.env` file
- **CORS Issues**: Update `FRONTEND_URL` in `.env` to match your frontend URL
- **Port Conflicts**: Change `PORT` in `.env` if 3001 is already in use
