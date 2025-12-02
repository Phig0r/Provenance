# Provenance Frontend

React + TypeScript frontend for the Provenance Digital Twin Product Authentication System.

## 🎯 Overview

This frontend application provides a comprehensive interface for the Provenance blockchain-based product authentication system. It features role-based dashboards for different user types and enables real-time product verification using blockchain technology and PUF (Physical Unclonable Functions).

## ✨ Features

### 🔐 Role-Based Access Control
- **Admin Dashboard** - Manage brands and system governance
- **Brand Dashboard** - Product minting, retailer management, and shipment tracking
- **Retailer Dashboard** - Inventory management and product sales
- **Consumer Interface** - Product verification and authenticity checking

### 🛡️ Product Authentication
- **Digital Twin Creation** - Mint NFTs representing physical products
- **PUF Integration** - Hardware-based authentication simulation
- **Real-Time Verification** - Instant product authenticity checks
- **Supply Chain Tracking** - Complete product lifecycle visibility

### 🎨 User Experience
- **Modern UI/UX** - Clean, professional interface design
- **Responsive Design** - Works on desktop and mobile devices
- **Real-Time Updates** - Live blockchain transaction status
- **Demo Mode** - Safe testing environment with role switching

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 19** | Frontend framework with latest features |
| **TypeScript** | Type-safe development and better maintainability |
| **Vite** | Fast build tool and development server |
| **Ethers.js** | Web3 integration and blockchain interactions |
| **CSS Modules** | Scoped styling and component isolation |
| **ESLint** | Code quality and consistency |

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MetaMask browser extension
- Sepolia testnet ETH (for testing)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   ```
   http://localhost:5173
   ```

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

## 🔗 Smart Contract Integration

The frontend connects to deployed smart contracts on Sepolia testnet:

- **Main Contract:** `0x81eEB7A87E91f490FbcbFfCbd70793886aE83a59`
- **Demo Role Faucet:** `0x0442a21D30346d753664F5CB2fDee23C8D9689B5`

## 📱 User Interfaces

### Landing Page
- Project overview and value proposition
- Wallet connection interface
- Role-based navigation

### Admin Dashboard
- Brand management and approval
- System governance controls
- Status monitoring

### Brand Dashboard
- Product minting interface
- Retailer registration and management
- Shipment tracking and returns handling

### Retailer Dashboard
- Inventory management
- Product sales and transfers
- Shipment receiving interface

### Consumer Verification
- Product ID input and verification
- PUF simulation and challenge-response
- Real-time blockchain verification results

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file for local development:

```env
VITE_PROVENANCE_CONTRACT_ADDRESS=0x81eEB7A87E91f490FbcbFfCbd70793886aE83a59
VITE_BACKEND_URL=http://localhost:3001
VITE_ENABLE_DEVTOOLS=true
```

### Backend Integration
The frontend integrates with the Provenance backend server for:
- PUF keypair management
- Product authenticator storage
- API endpoints for enhanced functionality

## 🧪 Testing

### Demo Mode
The application includes a demo role faucet for safe testing:
1. Connect your wallet
2. Click "Switch Role" 
3. Select desired role (Admin, Brand, Retailer, Consumer)
4. Explore the interface without real transactions

### Testnet Requirements
- **Sepolia ETH** for gas fees
- **MetaMask** configured for Sepolia testnet
- **Test products** for verification testing

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── admin/          # Admin-specific components
│   │   ├── brand/          # Brand-specific components
│   │   ├── shared/         # Shared components
│   │   └── verification/   # Verification components
│   ├── pages/              # Main application pages
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions and constants
│   └── assets/             # Static assets and icons
├── public/                 # Public static files
└── dist/                   # Production build output
```

## 🔒 Security Features

- **Wallet Integration** - Secure MetaMask connection
- **Role-Based Access** - Smart contract enforced permissions
- **Input Validation** - Client-side and blockchain validation
- **Error Handling** - Comprehensive error management
- **Transaction Safety** - User confirmation for all blockchain operations

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Deployment Options
- **Vercel** (recommended for React apps)
- **Netlify** (excellent for static sites)
- **GitHub Pages** (free hosting option)

## 📚 Documentation

- **Main Project README:** `../README.md`
- **Backend Documentation:** `../backend/README.md`
- **Smart Contracts:** `../smart-contracts/README.md`
- **Technical Documentation:** `../documentation/Documentation.pdf`

## 🤝 Contributing

This is a portfolio project demonstrating full-stack blockchain development skills. The codebase showcases:

- Modern React development practices
- TypeScript implementation
- Web3 integration patterns
- Professional UI/UX design
- Comprehensive error handling

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

**Built with ❤️ for demonstrating advanced blockchain development capabilities**