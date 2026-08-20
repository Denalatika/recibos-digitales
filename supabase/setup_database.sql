-- ==============================================================================
-- SCRIPT DE INICIALIZACIÓN COMPLETA - RECIBOS DIGITALES PLATFORM
-- Ejecuta este script completo en el SQL Editor de tu proyecto de Supabase
-- ==============================================================================

-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLA: EMPRESAS (companies)
CREATE TABLE IF NOT EXISTS public.companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    business_name TEXT NOT NULL,
    rfc TEXT,
    tax_regime TEXT,
    address TEXT,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    website TEXT,
    logo_url TEXT,
    slogan TEXT,
    primary_color TEXT NOT NULL DEFAULT '#0b192c',
    secondary_color TEXT NOT NULL DEFAULT '#334155',
    accent_color TEXT NOT NULL DEFAULT '#00a8cc',
    folio_prefix TEXT NOT NULL DEFAULT 'SYSS',
    next_folio_number INT NOT NULL DEFAULT 1,
    signer_name TEXT,
    signer_role TEXT,
    signer_signature_url TEXT,
    paper_size TEXT NOT NULL DEFAULT 'letter_landscape',
    currency TEXT NOT NULL DEFAULT 'MXN',
    timezone TEXT NOT NULL DEFAULT 'America/Mexico_City',
    legal_disclaimer TEXT DEFAULT '',
    show_header BOOLEAN NOT NULL DEFAULT true,
    show_footer BOOLEAN NOT NULL DEFAULT true,
    show_payment_info BOOLEAN NOT NULL DEFAULT true,
    show_qr_validation BOOLEAN NOT NULL DEFAULT true,
    show_signature BOOLEAN NOT NULL DEFAULT true,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 3. TABLA: PERSONAS / COLABORADORES (people)
CREATE TABLE IF NOT EXISTS public.people (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    person_type TEXT NOT NULL DEFAULT 'worker',
    full_name TEXT NOT NULL,
    internal_id TEXT,
    department TEXT,
    position TEXT,
    rfc TEXT,
    curp TEXT,
    nss TEXT,
    contract_type TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    bank_name TEXT,
    bank_account_masked TEXT,
    clabe_masked TEXT,
    hire_date DATE,
    status TEXT NOT NULL DEFAULT 'active',
    internal_notes TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 4. TABLA: RECIBOS (receipts)
CREATE TABLE IF NOT EXISTS public.receipts (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    person_id TEXT NOT NULL REFERENCES public.people(id) ON DELETE RESTRICT,
    receipt_type TEXT NOT NULL DEFAULT 'payroll',
    folio TEXT NOT NULL,
    internal_folio TEXT,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    frequency TEXT NOT NULL DEFAULT 'biweekly',
    status TEXT NOT NULL DEFAULT 'draft',
    currency TEXT NOT NULL DEFAULT 'MXN',
    payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
    bank_name TEXT,
    bank_account_masked TEXT,
    deposit_date DATE,
    verification_code TEXT NOT NULL UNIQUE,
    signer_name TEXT,
    signer_role TEXT,
    signer_signature_url TEXT,
    notes TEXT,
    total_earnings NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_deductions NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    net_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 5. TABLA: PERCEPCIONES (receipt_earnings)
CREATE TABLE IF NOT EXISTS public.receipt_earnings (
    id TEXT PRIMARY KEY,
    receipt_id TEXT NOT NULL REFERENCES public.receipts(id) ON DELETE CASCADE,
    concept TEXT NOT NULL,
    reference TEXT,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. TABLA: DEDUCCIONES (receipt_deductions)
CREATE TABLE IF NOT EXISTS public.receipt_deductions (
    id TEXT PRIMARY KEY,
    receipt_id TEXT NOT NULL REFERENCES public.receipts(id) ON DELETE CASCADE,
    concept TEXT NOT NULL,
    reference TEXT,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. TABLA: ENLACES COMPARTIDOS (share_links)
CREATE TABLE IF NOT EXISTS public.share_links (
    id TEXT PRIMARY KEY,
    receipt_id TEXT NOT NULL REFERENCES public.receipts(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT false,
    access_count INT NOT NULL DEFAULT 0,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- POLÍTICAS DE SEGURIDAD (RLS) - Permisivo para clientes autorizados
-- ==============================================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir lectura y escritura desde la aplicación web
DROP POLICY IF EXISTS "Acceso completo a companies" ON public.companies;
CREATE POLICY "Acceso completo a companies" ON public.companies FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso completo a people" ON public.people;
CREATE POLICY "Acceso completo a people" ON public.people FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso completo a receipts" ON public.receipts;
CREATE POLICY "Acceso completo a receipts" ON public.receipts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso completo a receipt_earnings" ON public.receipt_earnings;
CREATE POLICY "Acceso completo a receipt_earnings" ON public.receipt_earnings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso completo a receipt_deductions" ON public.receipt_deductions;
CREATE POLICY "Acceso completo a receipt_deductions" ON public.receipt_deductions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso completo a share_links" ON public.share_links;
CREATE POLICY "Acceso completo a share_links" ON public.share_links FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- STORAGE BUCKET: Para logotipos y firmas en la nube
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipt-assets', 'receipt-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Acceso público lectura a receipt-assets" ON storage.objects;
CREATE POLICY "Acceso público lectura a receipt-assets" ON storage.objects
FOR SELECT USING (bucket_id = 'receipt-assets');

DROP POLICY IF EXISTS "Acceso público subida a receipt-assets" ON storage.objects;
CREATE POLICY "Acceso público subida a receipt-assets" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'receipt-assets');

DROP POLICY IF EXISTS "Acceso público actualización a receipt-assets" ON storage.objects;
CREATE POLICY "Acceso público actualización a receipt-assets" ON storage.objects
FOR UPDATE USING (bucket_id = 'receipt-assets');

DROP POLICY IF EXISTS "Acceso público eliminación a receipt-assets" ON storage.objects;
CREATE POLICY "Acceso público eliminación a receipt-assets" ON storage.objects
FOR DELETE USING (bucket_id = 'receipt-assets');

-- ==============================================================================
-- DATOS INICIALES DE EJEMPLO
-- ==============================================================================
INSERT INTO public.companies (
    id, name, business_name, rfc, tax_regime, address, phone, email, website,
    logo_url, slogan, primary_color, secondary_color, accent_color, folio_prefix,
    next_folio_number, signer_name, signer_role
) VALUES (
    'comp-syss-001',
    'Soluciones y Sistemas de Seguridad',
    'SOLUCIONES Y SISTEMAS DE SEGURIDAD S.A. DE C.V.',
    'SYSS920715AAA',
    '601 - General de Ley Personas Morales',
    'Calle Los Olivos #711, Colonia Kennedy, Nogales, Sonora',
    '+52 631 115 7032',
    'eleliasespinoza@hotmail.com',
    'www.sysseguridad.com.mx',
    'https://raw.githubusercontent.com/Denalatika/recibos-digitales/main/public/logo-syss.png',
    'INNOVACIÓN • CONFIANZA • PROTECCIÓN',
    '#0b192c',
    '#334155',
    '#00a8cc',
    'SYSS',
    791,
    'Lic. Karla Hernández López',
    'Gerente de Administración'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.people (
    id, company_id, person_type, full_name, internal_id, department, position,
    rfc, contract_type, phone, email, address, bank_name, bank_account_masked,
    hire_date, status
) VALUES (
    'per-001',
    'comp-syss-001',
    'worker',
    'María Fernanda Ríos Martínez',
    'COL-0184',
    'Ingeniería',
    'Coordinador de Proyectos',
    'RIMM920715MDFRNR06',
    'Sueldos y Salarios e Ingresos Asimilados a Salarios',
    '631-555-0199',
    'm.rios@sysseguridad.com.mx',
    'Av. Tecnológico #450, Nogales, Son.',
    'Santander',
    '•••• 6712',
    '2022-03-15',
    'active'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.receipts (
    id, company_id, person_id, receipt_type, folio, internal_folio,
    issue_date, payment_date, period_start, period_end, frequency,
    status, currency, payment_method, bank_name, bank_account_masked,
    deposit_date, verification_code, signer_name, signer_role,
    total_earnings, total_deductions, net_total
) VALUES (
    'demo-receipt-syss-001',
    'comp-syss-001',
    'per-001',
    'payroll',
    'SYSS-2608-0790',
    'SYSSINT-015-0790',
    '2026-08-20',
    '2026-08-20',
    '2026-08-20',
    '2026-08-20',
    'biweekly',
    'authorized',
    'MXN',
    'bank_transfer',
    'Santander',
    '•••• 6712',
    '2026-08-20',
    'SYSS-9Q7R-DEMO',
    'Lic. Karla Hernández López',
    'Gerente de Administración',
    18000.00,
    5964.95,
    12035.05
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.receipt_earnings (id, receipt_id, concept, reference, amount, display_order)
VALUES 
    ('ear-demo-1', 'demo-receipt-syss-001', 'Sueldo Base', '15.00 días', 14000.00, 1),
    ('ear-demo-2', 'demo-receipt-syss-001', 'Bonificación por Desempeño', 'Quincenal', 2800.00, 2),
    ('ear-demo-3', 'demo-receipt-syss-001', 'Vales de Despensa', 'Evento', 700.00, 3),
    ('ear-demo-4', 'demo-receipt-syss-001', 'Ayuda de Transporte', 'Evento', 500.00, 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.receipt_deductions (id, receipt_id, concept, reference, amount, display_order)
VALUES 
    ('ded-demo-1', 'demo-receipt-syss-001', 'ISR', 'Artículo 96 LISR', 2482.80, 1),
    ('ded-demo-2', 'demo-receipt-syss-001', 'IMSS', 'Trabajador', 482.15, 2),
    ('ded-demo-3', 'demo-receipt-syss-001', 'Infonavit', 'Crédito', 2600.00, 3),
    ('ded-demo-4', 'demo-receipt-syss-001', 'Fondo de Ahorro', 'Contrato', 400.00, 4)
ON CONFLICT (id) DO NOTHING;
