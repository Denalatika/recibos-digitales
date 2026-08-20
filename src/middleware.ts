import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const pathname = request.nextUrl.pathname;

  // Rutas públicas exentas de autenticación
  const isPublicRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/validate') ||
    pathname.startsWith('/share') ||
    pathname.startsWith('/api/validate') ||
    pathname.startsWith('/api/share') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico';

  // Si Supabase no está configurado (modo offline local), permitir navegación
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project-id')) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: '', ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({ name, value: '', ...options });
      },
    },
  });

  // Validar y refrescar la sesión del usuario mediante cookies
  const { data: { user } } = await supabase.auth.getUser();

  // Si no está autenticado y accede a una ruta protegida -> Redirigir a /login
  if (!user && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Si ya está autenticado e intenta acceder a /login -> Redirigir a /
  if (user && pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Interceptar todas las rutas excepto archivos estáticos
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
