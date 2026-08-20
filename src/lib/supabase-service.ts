'use client';

import { supabase, isSupabaseConfigured } from './supabase';
import { Company, Person, Receipt, ShareLink } from '@/types/database';

/**
 * Autenticación con Supabase
 */
export async function signInWithEmail(email: string, password: string): Promise<{ user: any; error: string | null }> {
  if (!supabase || !isSupabaseConfigured) {
    return { user: { id: 'demo-user', email, full_name: 'Administrador Demo' }, error: null };
  }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return { user: null, error: error.message };
    }
    return { user: data.user, error: null };
  } catch (err: any) {
    return { user: null, error: err?.message || 'Error al iniciar sesión' };
  }
}

export async function signUpWithEmail(email: string, password: string, fullName: string): Promise<{ user: any; error: string | null }> {
  if (!supabase || !isSupabaseConfigured) {
    return { user: { id: 'demo-user', email, full_name: fullName }, error: null };
  }
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) {
      return { user: null, error: error.message };
    }
    return { user: data.user, error: null };
  } catch (err: any) {
    return { user: null, error: err?.message || 'Error al registrar usuario' };
  }
}

export async function signOutUser(): Promise<void> {
  if (supabase && isSupabaseConfigured) {
    await supabase.auth.signOut();
  }
}

/**
 * Generación atómica de folios en PostgreSQL (Supabase)
 */
export async function fetchNextFolioFromSupabase(companyId: string): Promise<string | null> {
  if (!supabase || !isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.rpc('get_next_folio', {
      p_company_id: companyId,
    });
    if (error) {
      console.warn('Error llamando get_next_folio RPC:', error.message);
      return null;
    }
    return data as string;
  } catch (err) {
    console.error('Error fetchNextFolioFromSupabase:', err);
    return null;
  }
}

/**
 * Servicio de Almacenamiento Multiempresa (Logos en bucket público, Firmas en bucket privado)
 */
export async function uploadAssetToSupabase(
  file: File,
  folder: 'logos' | 'letterheads' | 'signatures' = 'logos',
  companyId?: string,
  receiptId?: string
): Promise<string | null> {
  if (!supabase || !isSupabaseConfigured) return null;

  try {
    const fileExt = file.name.split('.').pop() || 'png';
    const targetCompanyId = companyId || 'default-company';

    if (folder === 'signatures') {
      const targetReceiptId = receiptId || 'general';
      const filePath = `${targetCompanyId}/${targetReceiptId}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('receipt-private-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.warn('Error subiendo firma a receipt-private-assets:', uploadError.message);
        return null;
      }

      const { data: publicUrlData } = supabase.storage
        .from('receipt-private-assets')
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } else {
      const subFolder = folder === 'letterheads' ? 'letterheads' : 'logos';
      const filePath = `${targetCompanyId}/${subFolder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('company-public-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.warn('Error subiendo logo a company-public-assets:', uploadError.message);
        return null;
      }

      const { data: publicUrlData } = supabase.storage
        .from('company-public-assets')
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    }
  } catch (err) {
    console.error('Excepción al subir imagen:', err);
    return null;
  }
}

/**
 * Servicio de Sincronización de Empresas
 */
export async function getCompaniesFromSupabase(): Promise<Company[] | null> {
  if (!supabase || !isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Error consultando companies en Supabase:', error.message);
      return null;
    }
    return data as Company[];
  } catch (err) {
    console.error('Error getCompaniesFromSupabase:', err);
    return null;
  }
}

export async function saveCompanyToSupabase(company: Company): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;
  try {
    const { error } = await supabase
      .from('companies')
      .upsert(company);

    if (error) {
      console.warn('Error guardando company en Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error saveCompanyToSupabase:', err);
    return false;
  }
}

/**
 * Servicio de Sincronización de Personas
 */
export async function getPeopleFromSupabase(): Promise<Person[] | null> {
  if (!supabase || !isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('people')
      .select('*')
      .is('deleted_at', null)
      .order('full_name', { ascending: true });

    if (error) {
      console.warn('Error consultando people en Supabase:', error.message);
      return null;
    }
    return data as Person[];
  } catch (err) {
    console.error('Error getPeopleFromSupabase:', err);
    return null;
  }
}

export async function savePersonToSupabase(person: Person): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;
  try {
    const { error } = await supabase
      .from('people')
      .upsert(person);

    if (error) {
      console.warn('Error guardando person en Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error savePersonToSupabase:', err);
    return false;
  }
}

/**
 * Servicio de Sincronización de Recibos
 */
export async function getReceiptsFromSupabase(): Promise<Receipt[] | null> {
  if (!supabase || !isSupabaseConfigured) return null;
  try {
    const { data: receiptsData, error: receiptsError } = await supabase
      .from('receipts')
      .select(`
        *,
        company:companies(*),
        person:people(*),
        earnings:receipt_earnings(*),
        deductions:receipt_deductions(*)
      `)
      .is('deleted_at', null)
      .order('payment_date', { ascending: false });

    if (receiptsError) {
      console.warn('Error consultando receipts en Supabase:', receiptsError.message);
      return null;
    }

    return receiptsData as Receipt[];
  } catch (err) {
    console.error('Error getReceiptsFromSupabase:', err);
    return null;
  }
}

export async function saveReceiptToSupabase(receipt: Receipt): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;
  try {
    const { company, person, earnings, deductions, ...mainReceipt } = receipt;

    const { error: receiptError } = await supabase
      .from('receipts')
      .upsert(mainReceipt);

    if (receiptError) {
      console.warn('Error guardando receipt en Supabase:', receiptError.message);
      return false;
    }

    if (earnings && earnings.length > 0) {
      await supabase.from('receipt_earnings').delete().eq('receipt_id', receipt.id);
      const earningsToInsert = earnings.map((e, idx) => ({
        ...e,
        receipt_id: receipt.id,
        display_order: idx + 1,
      }));
      await supabase.from('receipt_earnings').insert(earningsToInsert);
    }

    if (deductions && deductions.length > 0) {
      await supabase.from('receipt_deductions').delete().eq('receipt_id', receipt.id);
      const deductionsToInsert = deductions.map((d, idx) => ({
        ...d,
        receipt_id: receipt.id,
        display_order: idx + 1,
      }));
      await supabase.from('receipt_deductions').insert(deductionsToInsert);
    }

    return true;
  } catch (err) {
    console.error('Error saveReceiptToSupabase:', err);
    return false;
  }
}

export async function deleteReceiptFromSupabase(id: string): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;
  try {
    const { error } = await supabase
      .from('receipts')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Error eliminando receipt en Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error deleteReceiptFromSupabase:', err);
    return false;
  }
}

export async function saveShareLinkToSupabase(shareLink: ShareLink): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('share_links').upsert(shareLink);
    if (error) {
      console.warn('Error guardando share_link en Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error saveShareLinkToSupabase:', err);
    return false;
  }
}
