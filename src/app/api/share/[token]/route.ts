import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const SECURE_HEADERS = {
  'Cache-Control': 'private, no-store, no-cache, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Content-Type-Options': 'nosniff',
};

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token;

  if (!token || typeof token !== 'string' || token.length < 8) {
    return NextResponse.json(
      { is_valid: false, message: 'Token de acceso no válido' },
      { 
        status: 400,
        headers: SECURE_HEADERS
      }
    );
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { is_valid: false, message: 'Servicio de base de datos no configurado' },
      { 
        status: 503,
        headers: SECURE_HEADERS
      }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Llamar a la función RPC segura para validar y obtener el recibo compartido
    const { data, error } = await supabase.rpc('get_shared_receipt', {
      p_token: token.trim(),
    });

    if (error) {
      const maskedToken = `${token.slice(0, 4)}...${token.slice(-4)}`;
      console.error(`Error consultando shared receipt (token: ${maskedToken}):`, error.message);
      return NextResponse.json(
        { is_valid: false, message: 'Error validando enlace compartido' },
        { 
          status: 500,
          headers: SECURE_HEADERS
        }
      );
    }

    if (!data || !data.is_valid) {
      return NextResponse.json(
        { is_valid: false, message: data?.message || 'Enlace no válido o expirado' },
        { 
          status: 404,
          headers: SECURE_HEADERS
        }
      );
    }

    return NextResponse.json(data, {
      headers: SECURE_HEADERS,
    });
  } catch (err) {
    console.error('Excepción en /api/share:', err);
    return NextResponse.json(
      { is_valid: false, message: 'Error interno del servidor' },
      { 
        status: 500,
        headers: SECURE_HEADERS
      }
    );
  }
}
