import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code;

  if (!code || typeof code !== 'string' || code.trim().length < 4) {
    return NextResponse.json(
      { is_valid: false, message: 'Código de verificación no proporcionado o inválido' },
      { 
        status: 400,
        headers: { 'Cache-Control': 'no-store, max-age=0' }
      }
    );
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { is_valid: false, message: 'Servicio de validación no configurado' },
      { 
        status: 503,
        headers: { 'Cache-Control': 'no-store, max-age=0' }
      }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Llamar a la función RPC segura que filtra estrictamente toda la PII en el servidor PostgreSQL
    const { data, error } = await supabase.rpc('get_receipt_public_validation', {
      p_code: code.trim().toUpperCase(),
    });

    if (error) {
      console.error('Error en RPC get_receipt_public_validation:', error.message);
      return NextResponse.json(
        { is_valid: false, message: 'Error validando comprobante' },
        { 
          status: 500,
          headers: { 'Cache-Control': 'no-store, max-age=0' }
        }
      );
    }

    if (!data || !data.is_valid) {
      return NextResponse.json(
        { is_valid: false, message: data?.message || 'Código de verificación no encontrado' },
        { 
          status: 404,
          headers: { 'Cache-Control': 'no-store, max-age=0' }
        }
      );
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
      },
    });
  } catch (err) {
    console.error('Excepción en /api/validate:', err);
    return NextResponse.json(
      { is_valid: false, message: 'Error interno del servidor' },
      { 
        status: 500,
        headers: { 'Cache-Control': 'no-store, max-age=0' }
      }
    );
  }
}
