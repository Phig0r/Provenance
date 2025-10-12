// Contract types will be imported from the actual contract files when needed

import type { Signer } from 'ethers';

// User Role Types
export type UserRole = 'admin' | 'brand' | 'retailer' | 'consumer';

// Status Types
export type VerificationStatus = 'idle' | 'pending' | 'challenge-generated' | 'challenge-confirmed' | 'signature-generated' | 'success' | 'failed' | 'notFound';
export type ProductStatus = 'inFactory' | 'inTransit' | 'inRetailer' | 'sold';
export type BrandStatus = 'active' | 'pending' | 'suspended' | 'revoked';
export type RetailerStatus = 'active' | 'pending' | 'suspended' | 'terminated';

// Toast Types
export type ToastType = 'info' | 'success' | 'error';

// Product Interface
export interface Product {
  id: number;
  name: string;
  status: ProductStatus;
  mintDate: string;
}

// Brand Interface
export interface Brand {
  address: string;
  name: string;
  website: string;
  status: BrandStatus;
  registrationDate: string;
}

// Brand Row Interface (for admin table)
export interface BrandRow {
  name: string;
  website: string;
  wallet: string;
  date: string;
  status: BrandStatus;
}

// Retailer Interface
export interface Retailer {
  address: string;
  name: string;
  status: RetailerStatus;
  registrationDate: string;
}

// Retailer Row Interface (for brand table)
export interface RetailerRow {
  name: string;
  wallet: string;
  date: string;
  status: RetailerStatus;
}

// Product Data Interface (for verification)
export interface ProductData {
  name: string;
  brandAddress: string;
  productAuthenticator: string;
  mintTimestamp: bigint;
}

// Header Props Interface
export interface HeaderProps {
  title: string;
  userRole: UserRole;
  onDisconnect?: () => void;
  signer: Signer;
  showToast: (message: string, type: ToastType, detail?: string) => void;
  status?: BrandStatus | RetailerStatus;
}

// Device Interface Props
export interface DeviceInterfaceProps {
  status: VerificationStatus;
  productId: string;
  setProductId: (id: string) => void;
  challenge: string;
  signature: string;
  isSimulating: boolean;
  productData?: ProductData | null;
  onGenerateChallenge: () => void;
  onConfirmChallenge: () => void;
  onRequestSignature: () => void;
  onVerifyOnChain: () => void;
  onReset: () => void;
}

// PUF Simulation Props
export interface PufSimulationProps {
  log: string[];
}

// Product Manager Props
export interface ProductManagerProps {
  products: Product[];
  viewType: 'brand' | 'retailer' | 'shipment';
  selectedProductIds: number[];
  onSelectionChange: (ids: number[]) => void;
  onProductSelect?: (productId: number) => void;
}

// Product Interaction Manager Props
export interface ProductInteractionManagerProps {
  viewType: 'brand' | 'retailer';
  products: Product[];
  brandAddress?: string;
  selectedProductIds: number[];
  onSelectionChange: (ids: number[]) => void;
  disabled?: boolean;
  isInitiatingShipment?: boolean;
  isReturningProducts?: boolean;
  isFinalizingSale?: boolean;
  onInitiateShipment?: (retailerAddress: string, tokenIds: number[], resetForm?: () => void) => void;
  onReturnProducts?: (tokenIds: number[]) => void;
  onFinalizeSale?: (tokenId: number, consumer: string) => void;
}

// Shipment Manager Props
export interface ShipmentManagerProps {
  products: Product[];
  viewType: 'shipment' | 'returns';
  disabled?: boolean;
  isConfirmingReturn?: boolean;
  isReceivingShipment?: boolean;
  onReceive?: (tokenIds: number[]) => Promise<void> | void;
}

// Toast Props
export interface ToastProps {
  show: boolean;
  message: string;
  type: ToastType;
  detail?: string;
  onClose: () => void;
}

// Switch Role Modal Props
export interface SwitchRoleModalProps {
  currentRole: UserRole;
  onClose: () => void;
  onConfirm: (role: UserRole) => void;
}

// Stat Card Props
export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

// Update Brand Status Props
export interface UpdateBrandStatusProps {
  brandName: string;
  currentStatus: BrandStatus;
  onClose: () => void;
  onUpdate: (newStatus: string) => void;
}

// Update Retailer Status Props
export interface UpdateRetailerStatusProps {
  retailerName: string;
  currentStatus: RetailerStatus;
  onClose: () => void;
  onUpdate: (newStatus: string) => void;
}