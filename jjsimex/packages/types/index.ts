// ============================================
// Types TypeScript partagés — JJ's IMEX
// TODO: Synchroniser avec le schéma Supabase
// ============================================

// ---- UTILISATEURS ----

export type UserRole = 'client' | 'admin' | 'super_admin' | 'employee';
export type DestinationCountry = 'haiti' | 'dominican_republic';
export type FidelityLevel = 'bronze' | 'silver' | 'gold';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone_whatsapp: string;
  role: UserRole;
  destination_country: DestinationCountry;
  destination_city: string;
  us_suite: string;
  loyalty_level: FidelityLevel;
  total_spent: number;
  is_active: boolean;
  is_verified: boolean;
  expo_push_token?: string;
  created_at: string;
  updated_at: string;
}

// ---- COLIS ----

export type ColisStatus =
  | 'awaiting_arrival' // En attente de réception
  | 'received_usa'    // Reçu à Miami
  | 'in_transit'      // En transit
  | 'arrived'         // Arrivé en Haïti/RD
  | 'ready_pickup'    // Prêt au retrait
  | 'delivered'       // Livré
  | 'pending';        // En attente

export type TransportMode = 'air' | 'sea';

export interface Colis {
  id: string;
  tracking_number: string | null; // Ex: JJI-2025-00847 (null while awaiting_arrival)
  request_number?: string; // Ex: JJI-REQ-2025-00001
  user_id: string;
  status: ColisStatus;
  category?: string;
  description?: string;
  weight_estimated?: number;
  carrier_name?: string;
  carrier_tracking_number?: string;
  recipient_first_name?: string;
  recipient_last_name?: string;
  recipient_phone?: string;
  transport_mode: TransportMode;
  real_weight_lbs: number;
  billed_weight_lbs: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'in' | 'cm';
  };
  declared_value: number;    // USD
  insurance_amount: number;  // USD
  destination_country: DestinationCountry;
  destination_city: string;
  destination_address: string;
  departure_id?: string;
  shipping_rate: number;
  total_price: number;
  notes?: string;
  admin_notes?: string;
  received_at?: string;
  shipped_at?: string;
  arrived_at?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ColisStatusHistory {
  id: string;
  colis_id: string;
  status: ColisStatus;
  updated_by: string; // user_id de l'admin
  notes?: string;
  created_at: string;
}

// ---- DÉPARTS ----

export type DepartureStatus = 'scheduled' | 'boarding' | 'departed' | 'arrived' | 'closed';

export interface Departure {
  id: string;
  transport_mode: TransportMode;
  origin: string;       // Ex: Miami, FL
  destinations: string[]; // Ex: ['Port-au-Prince', 'Cap-Haïtien']
  departure_date: string;
  capacity_lbs: number;
  current_weight: number;
  status: DepartureStatus;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ---- PERSONAL SHOPPER ----

export type ShopperStatus = 'pending' | 'quoted' | 'accepted' | 'purchasing' | 'shipped' | 'cancelled';

export interface ShopperRequest {
  id: string;
  request_number: string; // Ex: PS-2025-00124
  user_id: string;
  product_url: string;
  merchant: string;
  quantity: number;
  variant?: string;
  destination_country: DestinationCountry;
  destination_city: string;
  transport_mode: TransportMode;
  notes?: string;
  estimated_product_price?: number;
  estimated_fees?: number;
  final_price?: number;
  status: ShopperStatus;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

// ---- PAIEMENTS ----

export type PaymentMethod = 'moncash' | 'zelle' | 'bank_transfer' | 'cash' | 'card';
export type PaymentStatus = 'pending' | 'confirmed' | 'failed' | 'refunded';
export type PaymentType = 'shipping' | 'shopper' | 'insurance';

export interface Payment {
  id: string;
  transaction_number: string; // Ex: TXN-00847
  user_id: string;
  colis_id?: string;
  shopper_request_id?: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  type: PaymentType;
  reference?: string;
  confirmed_by?: string;
  confirmed_at?: string;
  created_at: string;
  updated_at: string;
}

// ---- SUCCURSALES ----

export interface Branch {
  id: string;
  name: string;
  city: string;
  country: DestinationCountry;
  address: string;
  phone: string;
  is_open: boolean;
  hours: {
    open: string;
    close: string;
    days: string[];
  };
  created_at: string;
  updated_at: string;
}

// ---- NOTIFICATIONS ----

export type NotificationType =
  | 'colis_received'
  | 'colis_transit'
  | 'colis_arrived'
  | 'colis_ready'
  | 'colis_delivered'
  | 'payment_confirmed'
  | 'shopper_quoted'
  | 'promo';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  created_at: string;
}

// ---- CALCULATEUR ----

export interface ShippingRate {
  id: string;
  destination_country: DestinationCountry;
  destination_city: string;
  transport_mode: TransportMode;
  price_per_lb: number; // USD par livre
  min_days: number;
  max_days: number;
  is_active: boolean;
  updated_at: string;
}

export interface ExchangeRate {
  id: string;
  from_currency: string; // USD
  to_currency: string;   // HTG ou DOP
  rate: number;
  updated_at: string;
}
