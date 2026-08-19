export type UserRole = 'owner' | 'admin' | 'operator' | 'viewer';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export type PaperSize = 'letter_landscape' | 'a4_landscape';

export interface Company {
  id: string;
  name: string;
  business_name: string;
  rfc?: string | null;
  tax_regime?: string | null;
  address?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
  logo_url?: string | null;
  slogan?: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  folio_prefix: string;
  next_folio_number: number;
  signer_name?: string | null;
  signer_role?: string | null;
  signer_signature_url?: string | null;
  paper_size: PaperSize;
  currency: string;
  timezone: string;
  legal_disclaimer: string;
  show_header: boolean;
  show_footer: boolean;
  show_payment_info: boolean;
  show_qr_validation: boolean;
  show_signature: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export type PersonType = 'worker' | 'collaborator' | 'user' | 'client' | 'supplier' | 'other';
export type PersonStatus = 'active' | 'archived';

export interface Person {
  id: string;
  company_id: string;
  person_type: PersonType;
  full_name: string;
  internal_id?: string | null;
  department?: string | null;
  position?: string | null;
  rfc?: string | null;
  curp?: string | null;
  nss?: string | null;
  contract_type?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  bank_name?: string | null;
  bank_account_masked?: string | null;
  clabe_masked?: string | null;
  hire_date?: string | null;
  status: PersonStatus;
  internal_notes?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export type ReceiptType = 
  | 'payroll' 
  | 'collaborator_payment' 
  | 'commission' 
  | 'fees' 
  | 'reimbursement' 
  | 'supplier_payment' 
  | 'general';

export type ReceiptFrequency = 'weekly' | 'biweekly' | 'monthly' | 'special' | 'other';
export type ReceiptStatus = 'draft' | 'authorized' | 'paid' | 'cancelled';
export type PaymentMethod = 'bank_transfer' | 'cash' | 'check' | 'electronic_wallet' | 'other';

export interface ReceiptEarning {
  id: string;
  receipt_id?: string;
  concept: string;
  reference: string;
  amount: number;
  display_order: number;
}

export interface ReceiptDeduction {
  id: string;
  receipt_id?: string;
  concept: string;
  reference: string;
  amount: number;
  display_order: number;
}

export interface Receipt {
  id: string;
  company_id: string;
  person_id: string;
  receipt_type: ReceiptType;
  folio: string;
  internal_folio?: string | null;
  issue_date: string;
  payment_date: string;
  period_start: string;
  period_end: string;
  frequency: ReceiptFrequency;
  status: ReceiptStatus;
  currency: string;
  payment_method: PaymentMethod;
  bank_name?: string | null;
  bank_account_masked?: string | null;
  deposit_date?: string | null;
  verification_code: string;
  signer_name?: string | null;
  signer_role?: string | null;
  signer_signature_url?: string | null;
  notes?: string | null;
  total_earnings: number;
  total_deductions: number;
  net_total: number;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;

  // Relaciones cargadas opcionalmente
  company?: Company;
  person?: Person;
  earnings?: ReceiptEarning[];
  deductions?: ReceiptDeduction[];
}

export interface ShareLink {
  id: string;
  receipt_id: string;
  token: string;
  expires_at: string;
  is_revoked: boolean;
  access_count: number;
  created_by?: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  company_id?: string | null;
  user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  details?: Record<string, unknown> | null;
  created_at: string;
}
