'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Company, 
  Person, 
  Receipt, 
  Profile, 
  ReceiptStatus,
  ShareLink
} from '@/types/database';
import { 
  DEMO_PROFILE, 
  DEMO_COMPANIES, 
  DEMO_PEOPLE, 
  DEMO_RECEIPTS 
} from '@/lib/demo-data';
import { generateVerificationCode, calculateTotals } from '@/lib/utils';

interface AppContextType {
  profile: Profile;
  companies: Company[];
  activeCompany: Company | null;
  setActiveCompanyId: (id: string) => void;
  addCompany: (company: Partial<Company>) => Company;
  updateCompany: (id: string, data: Partial<Company>) => void;
  
  people: Person[];
  activeCompanyPeople: Person[];
  addPerson: (person: Partial<Person>) => Person;
  updatePerson: (id: string, data: Partial<Person>) => void;
  archivePerson: (id: string) => void;

  receipts: Receipt[];
  activeCompanyReceipts: Receipt[];
  getReceipt: (id: string) => Receipt | undefined;
  getReceiptByVerificationCode: (code: string) => Receipt | undefined;
  addReceipt: (receipt: Partial<Receipt>) => Receipt;
  updateReceipt: (id: string, data: Partial<Receipt>) => void;
  duplicateReceipt: (id: string) => Receipt;
  updateReceiptStatus: (id: string, status: ReceiptStatus) => void;
  deleteReceipt: (id: string) => void;

  shareLinks: ShareLink[];
  createShareLink: (receiptId: string, hoursValid?: number) => { token: string; url: string; expiresAt: string };
  revokeShareLink: (token: string) => void;
  getShareLink: (token: string) => { link: ShareLink; receipt: Receipt } | null;

  resetToDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile] = useState<Profile>(DEMO_PROFILE);
  const [companies, setCompanies] = useState<Company[]>(DEMO_COMPANIES);
  const [activeCompanyId, setActiveCompanyId] = useState<string>(DEMO_COMPANIES[0].id);
  const [people, setPeople] = useState<Person[]>(DEMO_PEOPLE);
  const [receipts, setReceipts] = useState<Receipt[]>(DEMO_RECEIPTS);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar estado inicial de LocalStorage si existe
  useEffect(() => {
    try {
      const savedCompanies = localStorage.getItem('rdp_companies');
      const savedPeople = localStorage.getItem('rdp_people');
      const savedReceipts = localStorage.getItem('rdp_receipts');
      const savedShareLinks = localStorage.getItem('rdp_share_links');
      const savedActiveCompanyId = localStorage.getItem('rdp_active_company_id');

      if (savedCompanies) {
        const parsed = JSON.parse(savedCompanies);
        // Garantizar que la empresa de muestra tenga el logotipo asignado
        const updated = parsed.map((c: Company) => {
          if (c.id === 'comp-syss-001' && !c.logo_url) {
            return { ...c, logo_url: '/logo-syss.png' };
          }
          return c;
        });
        setCompanies(updated);
      }
      if (savedPeople) setPeople(JSON.parse(savedPeople));
      if (savedReceipts) setReceipts(JSON.parse(savedReceipts));
      if (savedShareLinks) setShareLinks(JSON.parse(savedShareLinks));
      if (savedActiveCompanyId) setActiveCompanyId(savedActiveCompanyId);
    } catch {
      // Ignorar errores de parseo y continuar con demo data
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Persistir en LocalStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('rdp_companies', JSON.stringify(companies));
      localStorage.setItem('rdp_people', JSON.stringify(people));
      localStorage.setItem('rdp_receipts', JSON.stringify(receipts));
      localStorage.setItem('rdp_share_links', JSON.stringify(shareLinks));
      localStorage.setItem('rdp_active_company_id', activeCompanyId);
    } catch {
      // LocalStorage lleno o restringido
    }
  }, [companies, people, receipts, shareLinks, activeCompanyId, isLoaded]);

  const activeCompany = companies.find(c => c.id === activeCompanyId) || companies[0] || null;
  const activeCompanyPeople = people.filter(p => p.company_id === activeCompanyId && p.status === 'active');
  const activeCompanyReceipts = receipts.filter(r => r.company_id === activeCompanyId);

  // Funciones de Empresa
  const addCompany = (data: Partial<Company>): Company => {
    const newCompany: Company = {
      id: `comp-${Date.now()}`,
      name: data.name || 'Nueva Empresa',
      business_name: data.business_name || data.name || 'NUEVA EMPRESA S.A. DE C.V.',
      rfc: data.rfc || null,
      tax_regime: data.tax_regime || null,
      address: data.address || null,
      phone: data.phone || null,
      whatsapp: data.whatsapp || null,
      email: data.email || null,
      website: data.website || null,
      logo_url: data.logo_url || null,
      slogan: data.slogan || null,
      primary_color: data.primary_color || '#0b192c',
      secondary_color: data.secondary_color || '#334155',
      accent_color: data.accent_color || '#00a8cc',
      folio_prefix: data.folio_prefix || 'REC',
      next_folio_number: 1,
      signer_name: data.signer_name || null,
      signer_role: data.signer_role || null,
      signer_signature_url: data.signer_signature_url || null,
      paper_size: data.paper_size || 'letter_landscape',
      currency: data.currency || 'MXN',
      timezone: data.timezone || 'America/Mexico_City',
      legal_disclaimer: data.legal_disclaimer || 'Este documento es un comprobante administrativo interno y no sustituye un CFDI de nómina timbrado.',
      show_header: data.show_header ?? true,
      show_footer: data.show_footer ?? true,
      show_payment_info: data.show_payment_info ?? true,
      show_qr_validation: data.show_qr_validation ?? true,
      show_signature: data.show_signature ?? true,
      created_by: profile.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setCompanies(prev => [...prev, newCompany]);
    setActiveCompanyId(newCompany.id);
    return newCompany;
  };

  const updateCompany = (id: string, data: Partial<Company>) => {
    setCompanies(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, ...data, updated_at: new Date().toISOString() };
      }
      return c;
    }));
  };

  // Funciones de Personas
  const addPerson = (data: Partial<Person>): Person => {
    const newPerson: Person = {
      id: `per-${Date.now()}`,
      company_id: data.company_id || activeCompanyId,
      person_type: data.person_type || 'worker',
      full_name: data.full_name || 'Nombre Desconocido',
      internal_id: data.internal_id || null,
      department: data.department || null,
      position: data.position || null,
      rfc: data.rfc || null,
      curp: data.curp || null,
      nss: data.nss || null,
      contract_type: data.contract_type || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      bank_name: data.bank_name || null,
      bank_account_masked: data.bank_account_masked || null,
      clabe_masked: data.clabe_masked || null,
      hire_date: data.hire_date || new Date().toISOString().split('T')[0],
      status: 'active',
      internal_notes: data.internal_notes || null,
      created_by: profile.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setPeople(prev => [...prev, newPerson]);
    return newPerson;
  };

  const updatePerson = (id: string, data: Partial<Person>) => {
    setPeople(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, ...data, updated_at: new Date().toISOString() };
      }
      return p;
    }));
  };

  const archivePerson = (id: string) => {
    updatePerson(id, { status: 'archived' });
  };

  // Funciones de Recibos
  const getReceipt = (id: string): Receipt | undefined => {
    const receipt = receipts.find(r => r.id === id);
    if (!receipt) return undefined;
    const company = companies.find(c => c.id === receipt.company_id);
    const person = people.find(p => p.id === receipt.person_id);
    return {
      ...receipt,
      company: company || receipt.company,
      person: person || receipt.person,
    };
  };

  const getReceiptByVerificationCode = (code: string): Receipt | undefined => {
    const clean = code.trim().toUpperCase();
    const receipt = receipts.find(r => r.verification_code.toUpperCase() === clean);
    if (!receipt) return undefined;
    const company = companies.find(c => c.id === receipt.company_id);
    const person = people.find(p => p.id === receipt.person_id);
    return {
      ...receipt,
      company,
      person,
    };
  };

  const addReceipt = (data: Partial<Receipt>): Receipt => {
    const comp = companies.find(c => c.id === (data.company_id || activeCompanyId)) || activeCompany!;
    const person = people.find(p => p.id === data.person_id);
    
    // Generar folio consecutivo
    const yearMonth = new Date().toISOString().slice(2, 7).replace('-', '');
    const folioNum = String(comp.next_folio_number).padStart(4, '0');
    const autoFolio = `${comp.folio_prefix}-${yearMonth}-${folioNum}`;
    const autoInternalFolio = `${comp.folio_prefix}INT-015-${folioNum}`;

    // Incrementar folio en la empresa
    updateCompany(comp.id, { next_folio_number: comp.next_folio_number + 1 });

    const earnings = data.earnings || [];
    const deductions = data.deductions || [];
    const totals = calculateTotals(earnings, deductions);

    const newReceipt: Receipt = {
      id: `rec-${Date.now()}`,
      company_id: comp.id,
      person_id: data.person_id || (person?.id || ''),
      receipt_type: data.receipt_type || 'payroll',
      folio: data.folio || autoFolio,
      internal_folio: data.internal_folio || autoInternalFolio,
      issue_date: data.issue_date || new Date().toISOString().split('T')[0],
      payment_date: data.payment_date || new Date().toISOString().split('T')[0],
      period_start: data.period_start || new Date().toISOString().split('T')[0],
      period_end: data.period_end || new Date().toISOString().split('T')[0],
      frequency: data.frequency || 'biweekly',
      status: data.status || 'draft',
      currency: data.currency || comp.currency || 'MXN',
      payment_method: data.payment_method || 'bank_transfer',
      bank_name: data.bank_name || person?.bank_name || 'Banco',
      bank_account_masked: data.bank_account_masked || person?.bank_account_masked || '•••• 0000',
      deposit_date: data.deposit_date || data.payment_date || new Date().toISOString().split('T')[0],
      verification_code: data.verification_code || generateVerificationCode(),
      signer_name: data.signer_name || comp.signer_name || 'Nombre del Firmante',
      signer_role: data.signer_role || comp.signer_role || 'Puesto del Firmante',
      signer_signature_url: data.signer_signature_url || comp.signer_signature_url || null,
      notes: data.notes || null,
      total_earnings: totals.totalEarnings,
      total_deductions: totals.totalDeductions,
      net_total: totals.netTotal,
      created_by: profile.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      earnings: earnings.map((e, idx) => ({ ...e, id: e.id || `ear-${Date.now()}-${idx}`, display_order: idx + 1 })),
      deductions: deductions.map((d, idx) => ({ ...d, id: d.id || `ded-${Date.now()}-${idx}`, display_order: idx + 1 })),
      company: comp,
      person: person,
    };

    setReceipts(prev => [newReceipt, ...prev]);
    return newReceipt;
  };

  const updateReceipt = (id: string, data: Partial<Receipt>) => {
    setReceipts(prev => prev.map(r => {
      if (r.id === id) {
        const earnings = data.earnings !== undefined ? data.earnings : r.earnings || [];
        const deductions = data.deductions !== undefined ? data.deductions : r.deductions || [];
        const totals = calculateTotals(earnings, deductions);

        return {
          ...r,
          ...data,
          earnings,
          deductions,
          total_earnings: totals.totalEarnings,
          total_deductions: totals.totalDeductions,
          net_total: totals.netTotal,
          updated_at: new Date().toISOString(),
        };
      }
      return r;
    }));
  };

  const duplicateReceipt = (id: string): Receipt => {
    const original = receipts.find(r => r.id === id);
    if (!original) throw new Error('Recibo no encontrado');

    const comp = companies.find(c => c.id === original.company_id) || activeCompany!;
    const yearMonth = new Date().toISOString().slice(2, 7).replace('-', '');
    const folioNum = String(comp.next_folio_number).padStart(4, '0');
    const autoFolio = `${comp.folio_prefix}-${yearMonth}-${folioNum}`;
    const autoInternalFolio = `${comp.folio_prefix}INT-015-${folioNum}`;

    updateCompany(comp.id, { next_folio_number: comp.next_folio_number + 1 });

    const duplicated: Receipt = {
      ...original,
      id: `rec-${Date.now()}`,
      folio: autoFolio,
      internal_folio: autoInternalFolio,
      issue_date: new Date().toISOString().split('T')[0],
      payment_date: new Date().toISOString().split('T')[0],
      status: 'draft',
      verification_code: generateVerificationCode(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      earnings: (original.earnings || []).map((e, idx) => ({ ...e, id: `ear-dup-${Date.now()}-${idx}` })),
      deductions: (original.deductions || []).map((d, idx) => ({ ...d, id: `ded-dup-${Date.now()}-${idx}` })),
    };

    setReceipts(prev => [duplicated, ...prev]);
    return duplicated;
  };

  const updateReceiptStatus = (id: string, status: ReceiptStatus) => {
    updateReceipt(id, { status });
  };

  const deleteReceipt = (id: string) => {
    setReceipts(prev => prev.filter(r => r.id !== id));
  };

  // Enlaces para compartir
  const createShareLink = (receiptId: string, hoursValid = 48) => {
    const token = `sh_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
    const expiresAt = new Date(Date.now() + hoursValid * 3600 * 1000).toISOString();
    
    const newLink: ShareLink = {
      id: `shk-${Date.now()}`,
      receipt_id: receiptId,
      token,
      expires_at: expiresAt,
      is_revoked: false,
      access_count: 0,
      created_by: profile.id,
      created_at: new Date().toISOString(),
    };

    setShareLinks(prev => [...prev, newLink]);
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    return {
      token,
      url: `${origin}/share/${token}`,
      expiresAt,
    };
  };

  const revokeShareLink = (token: string) => {
    setShareLinks(prev => prev.map(sl => sl.token === token ? { ...sl, is_revoked: true } : sl));
  };

  const getShareLink = (token: string) => {
    const link = shareLinks.find(sl => sl.token === token);
    if (!link) return null;
    if (link.is_revoked) return null;
    if (new Date(link.expires_at) < new Date()) return null;

    const receipt = getReceipt(link.receipt_id);
    if (!receipt) return null;

    return { link, receipt };
  };

  const resetToDemoData = () => {
    setCompanies(DEMO_COMPANIES);
    setPeople(DEMO_PEOPLE);
    setReceipts(DEMO_RECEIPTS);
    setShareLinks([]);
    setActiveCompanyId(DEMO_COMPANIES[0].id);
    localStorage.clear();
  };

  return (
    <AppContext.Provider
      value={{
        profile,
        companies,
        activeCompany,
        setActiveCompanyId,
        addCompany,
        updateCompany,
        people,
        activeCompanyPeople,
        addPerson,
        updatePerson,
        archivePerson,
        receipts,
        activeCompanyReceipts,
        getReceipt,
        getReceiptByVerificationCode,
        addReceipt,
        updateReceipt,
        duplicateReceipt,
        updateReceiptStatus,
        deleteReceipt,
        shareLinks,
        createShareLink,
        revokeShareLink,
        getShareLink,
        resetToDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe ser utilizado dentro de un AppProvider');
  }
  return context;
};
