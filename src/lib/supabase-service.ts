'use client';

import { supabase, isSupabaseConfigured } from './supabase';
import { Company, Person, Receipt, ReceiptEarning, ReceiptDeduction } from '@/types/database';

/**
 * Servicio de Almacenamiento de Archivos (Logos y Firmas)
 */
export async function uploadAssetToSupabase(
  file: File,
  folder: 'logos' | 'signatures' = 'logos'
): Promise<string | null> {
  if (!supabase || !isSupabaseConfigured) return null;

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('receipt-assets')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.warn('Error subiendo imagen a Supabase Storage:', uploadError.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('receipt-assets')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
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
    // 1. Guardar recibo principal (sin las relaciones anidadas)
    const { company, person, earnings, deductions, ...mainReceipt } = receipt;

    const { error: receiptError } = await supabase
      .from('receipts')
      .upsert(mainReceipt);

    if (receiptError) {
      console.warn('Error guardando receipt en Supabase:', receiptError.message);
      return false;
    }

    // 2. Guardar percepciones
    if (earnings && earnings.length > 0) {
      await supabase.from('receipt_earnings').delete().eq('receipt_id', receipt.id);
      const earningsToInsert = earnings.map((e, idx) => ({
        ...e,
        receipt_id: receipt.id,
        display_order: idx + 1,
      }));
      await supabase.from('receipt_earnings').insert(earningsToInsert);
    }

    // 3. Guardar deducciones
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
