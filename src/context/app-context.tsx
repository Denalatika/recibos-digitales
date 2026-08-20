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
import { 
  generateVerificationCode, 
  generateSecureToken, 
  calculateTotals, 
  getAppBaseUrl 
} from '@/lib/utils';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { 
  getCompaniesFromSupabase, 
  saveCompanyToSupabase,
  getPeopleFromSupabase,
  savePersonToSupabase,
  getReceiptsFromSupabase,
  saveReceiptToSupabase,
  deleteReceiptFromSupabase,
  signInWithEmail,
  signUpWithEmail,
  signOutUser,
  saveShareLinkToSupabase
} from '@/lib/supabase-service';

interface AppContextType {
  profile: Profile;
  user: any | null;
  session: any | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;

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
  isCloudConnected: boolean;
  isSyncing: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [profile, setProfile] = useState<Profile>(DEMO_PROFILE);

  const [companies, setCompanies] = useState<Company[]>(DEMO_COMPANIES);
  const [activeCompanyId, setActiveCompanyId] = useState<string>(DEMO_COMPANIES[0].id);
  const [people, setPeople] = useState<Person[]>(DEMO_PEOPLE);
  const [receipts, setReceipts] = useState<Receipt[]>(DEMO_RECEIPTS);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCloudConnected] = useState(isSupabaseConfigured);

  // 1. Manejo de Autenticación con Supabase
  useEffect(() => {
    async function initAuth() {
      if (supabase && isSupabaseConfigured) {
        try {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (currentSession) {
            setSession(currentSession);
            setUser(currentSession.user);
            setProfile({
              id: currentSession.user.id,
              full_name: currentSession.user.user_metadata?.full_name || currentSession.user.email?.split('@')[0] || 'Administrador',
              email: currentSession.user.email || '',
              role: 'owner',
              created_at: currentSession.user.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }

          const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession);
            setUser(newSession?.user || null);
            if (newSession?.user) {
              setProfile({
                id: newSession.user.id,
                full_name: newSession.user.user_metadata?.full_name || newSession.user.email?.split('@')[0] || 'Administrador',
                email: newSession.user.email || '',
                role: 'owner',
                created_at: newSession.user.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            }
          });

          return () => {
            subscription.unsubscribe();
          };
        } catch (err) {
          console.warn('Error inicializando auth de Supabase:', err);
        } finally {
          setIsLoadingAuth(false);
        }
      } else {
        setIsLoadingAuth(false);
      }
    }

    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { user: loggedUser, error } = await signInWithEmail(email, password);
    if (!error && loggedUser) {
      setUser(loggedUser);
      setProfile(prev => ({
        ...prev,
        id: loggedUser.id,
        email: loggedUser.email || email,
        full_name: loggedUser.user_metadata?.full_name || email.split('@')[0],
      }));
      return { error: null };
    }
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { user: registeredUser, error } = await signUpWithEmail(email, password, fullName);
    if (!error && registeredUser) {
      setUser(registeredUser);
      setProfile(prev => ({
        ...prev,
        id: registeredUser.id,
        email: registeredUser.email || email,
        full_name: fullName,
      }));
      return { error: null };
    }
    return { error };
  };

  const signOut = async () => {
    await signOutUser();
    setUser(null);
    setSession(null);
  };

  // 2. Cargar datos iniciales (Local + Nube Supabase)
  useEffect(() => {
    async function loadData() {
      setIsSyncing(true);

      // Cargar caché local primero para rapidez
      try {
        const savedCompanies = localStorage.getItem('rdp_companies');
        const savedPeople = localStorage.getItem('rdp_people');
        const savedReceipts = localStorage.getItem('rdp_receipts');
        const savedShareLinks = localStorage.getItem('rdp_share_links');
        const savedActiveCompanyId = localStorage.getItem('rdp_active_company_id');

        if (savedCompanies) setCompanies(JSON.parse(savedCompanies));
        if (savedPeople) setPeople(JSON.parse(savedPeople));
        if (savedReceipts) setReceipts(JSON.parse(savedReceipts));
        if (savedShareLinks) setShareLinks(JSON.parse(savedShareLinks));
        if (savedActiveCompanyId) setActiveCompanyId(savedActiveCompanyId);
      } catch (err) {
        console.warn('Error leyendo LocalStorage:', err);
      }

      // Si Supabase está configurado, sincronizar con la nube
      if (isSupabaseConfigured) {
        try {
          const [cloudCompanies, cloudPeople, cloudReceipts] = await Promise.all([
            getCompaniesFromSupabase(),
            getPeopleFromSupabase(),
            getReceiptsFromSupabase(),
          ]);

          if (cloudCompanies && cloudCompanies.length > 0) {
            setCompanies(cloudCompanies);
            if (!cloudCompanies.find(c => c.id === activeCompanyId)) {
              setActiveCompanyId(cloudCompanies[0].id);
            }
          }

          if (cloudPeople && cloudPeople.length > 0) {
            setPeople(cloudPeople);
          }

          if (cloudReceipts && cloudReceipts.length > 0) {
            setReceipts(cloudReceipts);
          }
        } catch (err) {
          console.warn('Error sincronizando con Supabase:', err);
        }
      }

      setIsLoaded(true);
      setIsSyncing(false);
    }

    loadData();
  }, [activeCompanyId]);

  // 3. Persistir en LocalStorage como respaldo
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
      legal_disclaimer: '',
      show_header: data.show_header ?? true,
      show_footer: data.show_footer ?? true,
      show_payment_info: data.show_payment_info ?? true,
      show_qr_validation: data.show_qr_validation ?? true,
      show_signature: data.show_signature ?? true,
      created_by: user?.id || profile.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setCompanies(prev => [...prev, newCompany]);
    setActiveCompanyId(newCompany.id);
    saveCompanyToSupabase(newCompany);
    return newCompany;
  };

  const updateCompany = (id: string, data: Partial<Company>) => {
    const updatedList = companies.map(c => {
      if (c.id === id) {
        return { ...c, ...data, updated_at: new Date().toISOString() };
      }
      return c;
    });
    setCompanies(updatedList);
    const target = updatedList.find(c => c.id === id);
    if (target) {
      saveCompanyToSupabase(target);
    }
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
      created_by: user?.id || profile.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setPeople(prev => [...prev, newPerson]);
    savePersonToSupabase(newPerson);
    return newPerson;
  };

  const updatePerson = (id: string, data: Partial<Person>) => {
    const updatedList = people.map(p => {
      if (p.id === id) {
        return { ...p, ...data, updated_at: new Date().toISOString() };
      }
      return p;
    });
    setPeople(updatedList);
    const target = updatedList.find(p => p.id === id);
    if (target) {
      savePersonToSupabase(target);
    }
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
    
    let autoFolio = data.folio;
    if (!autoFolio) {
      const yearMonth = new Date().toISOString().slice(2, 7).replace('-', '');
      const folioNum = String(comp.next_folio_number).padStart(4, '0');
      autoFolio = `${comp.folio_prefix}-${yearMonth}-${folioNum}`;
      updateCompany(comp.id, { next_folio_number: comp.next_folio_number + 1 });
    }

    const autoInternalFolio = `${comp.folio_prefix}INT-015-${autoFolio.split('-').pop() || '0001'}`;
    const earnings = data.earnings || [];
    const deductions = data.deductions || [];
    const totals = calculateTotals(earnings, deductions);

    const newReceipt: Receipt = {
      id: `rec-${Date.now()}`,
      company_id: comp.id,
      person_id: data.person_id || (person?.id || ''),
      receipt_type: data.receipt_type || 'payroll',
      folio: autoFolio,
      internal_folio: data.internal_folio || autoInternalFolio,
      issue_date: data.issue_date || new Date().toISOString().split('T')[0],
      payment_date: data.payment_date || new Date().toISOString().split('T')[0],
      period_start: data.period_start || new Date().toISOString().split('T')[0],
      period_end: data.period_end || new Date().toISOString().split('T')[0],
      frequency: data.frequency || 'biweekly',
      status: data.status || 'draft',
      currency: data.currency || comp.currency || 'MXN',
      payment_method: data.payment_method || 'bank_transfer',
      bank_name: data.bank_name || person?.bank_name || 'Santander',
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
      created_by: user?.id || profile.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      earnings: earnings.map((e, idx) => ({ ...e, id: e.id || `ear-${Date.now()}-${idx}`, display_order: idx + 1 })),
      deductions: deductions.map((d, idx) => ({ ...d, id: d.id || `ded-${Date.now()}-${idx}`, display_order: idx + 1 })),
      company: comp,
      person: person,
    };

    setReceipts(prev => [newReceipt, ...prev]);
    saveReceiptToSupabase(newReceipt);
    return newReceipt;
  };

  const updateReceipt = (id: string, data: Partial<Receipt>) => {
    let updatedReceipt: Receipt | null = null;
    const updatedList = receipts.map(r => {
      if (r.id === id) {
        const earnings = data.earnings !== undefined ? data.earnings : r.earnings || [];
        const deductions = data.deductions !== undefined ? data.deductions : r.deductions || [];
        const totals = calculateTotals(earnings, deductions);

        const updated: Receipt = {
          ...r,
          ...data,
          earnings,
          deductions,
          total_earnings: totals.totalEarnings,
          total_deductions: totals.totalDeductions,
          net_total: totals.netTotal,
          updated_at: new Date().toISOString(),
        };
        updatedReceipt = updated;
        return updated;
      }
      return r;
    });

    setReceipts(updatedList);
    if (updatedReceipt) {
      saveReceiptToSupabase(updatedReceipt);
    }
  };

  const duplicateReceipt = (id: string): Receipt => {
    const original = getReceipt(id);
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
      earnings: (original.earnings || []).map((e, idx) => ({ ...e, id: `ear-${Date.now()}-${idx}` })),
      deductions: (original.deductions || []).map((d, idx) => ({ ...d, id: `ded-${Date.now()}-${idx}` })),
    };

    setReceipts(prev => [duplicated, ...prev]);
    saveReceiptToSupabase(duplicated);
    return duplicated;
  };

  const updateReceiptStatus = (id: string, status: ReceiptStatus) => {
    updateReceipt(id, { status });
  };

  const deleteReceipt = (id: string) => {
    setReceipts(prev => prev.filter(r => r.id !== id));
    deleteReceiptFromSupabase(id);
  };

  // Enlaces compartidos
  const createShareLink = (receiptId: string, hoursValid = 72) => {
    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + hoursValid * 60 * 60 * 1000).toISOString();
    
    const newLink: ShareLink = {
      id: `link-${Date.now()}`,
      receipt_id: receiptId,
      token,
      expires_at: expiresAt,
      is_revoked: false,
      access_count: 0,
      created_by: user?.id || profile.id,
      created_at: new Date().toISOString(),
    };

    setShareLinks(prev => [...prev, newLink]);
    saveShareLinkToSupabase(newLink);

    const baseUrl = getAppBaseUrl();
    return {
      token,
      url: `${baseUrl}/share/${token}`,
      expiresAt,
    };
  };

  const revokeShareLink = (token: string) => {
    setShareLinks(prev => prev.map(l => l.token === token ? { ...l, is_revoked: true } : l));
  };

  const getShareLink = (token: string) => {
    const link = shareLinks.find(l => l.token === token && !l.is_revoked);
    if (!link) return null;
    if (new Date(link.expires_at) < new Date()) return null;

    const receipt = getReceipt(link.receipt_id);
    if (!receipt) return null;

    return { link, receipt };
  };

  const resetToDemoData = () => {
    setCompanies(DEMO_COMPANIES);
    setActiveCompanyId(DEMO_COMPANIES[0].id);
    setPeople(DEMO_PEOPLE);
    setReceipts(DEMO_RECEIPTS);
    setShareLinks([]);
    localStorage.clear();
  };

  return (
    <AppContext.Provider
      value={{
        profile,
        user,
        session,
        isAuthenticated: Boolean(user || session),
        isLoadingAuth,
        signIn,
        signUp,
        signOut,
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
        isCloudConnected,
        isSyncing,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
