-- ==============================================================================
-- PLATAFORMA DE RECIBOS DIGITALES Y ADMINISTRACIÓN EMPRESARIAL
-- MIGRACIÓN INICIAL COMPLETA (PostgreSQL / Supabase con RLS)
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLA: Perfiles de Usuario (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('owner', 'admin', 'operator', 'viewer')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TABLA: Empresas (companies)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    paper_size TEXT NOT NULL DEFAULT 'letter_landscape' CHECK (paper_size IN ('letter_landscape', 'a4_landscape')),
    currency TEXT NOT NULL DEFAULT 'MXN',
    timezone TEXT NOT NULL DEFAULT 'America/Mexico_City',
    legal_disclaimer TEXT NOT NULL DEFAULT 'Este documento es un comprobante administrativo interno y no sustituye un CFDI de nómina timbrado.',
    show_header BOOLEAN NOT NULL DEFAULT true,
    show_footer BOOLEAN NOT NULL DEFAULT true,
    show_payment_info BOOLEAN NOT NULL DEFAULT true,
    show_qr_validation BOOLEAN NOT NULL DEFAULT true,
    show_signature BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 4. TABLA: Miembros de la Empresa (company_members)
CREATE TABLE IF NOT EXISTS public.company_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('owner', 'admin', 'operator', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(company_id, user_id)
);

-- 5. TABLA: Directorio de Personas (people)
CREATE TABLE IF NOT EXISTS public.people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    person_type TEXT NOT NULL DEFAULT 'worker' CHECK (person_type IN ('worker', 'collaborator', 'user', 'client', 'supplier', 'other')),
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
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    internal_notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 6. TABLA: Recibos (receipts)
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE RESTRICT,
    receipt_type TEXT NOT NULL DEFAULT 'payroll' CHECK (receipt_type IN ('payroll', 'collaborator_payment', 'commission', 'fees', 'reimbursement', 'supplier_payment', 'general')),
    folio TEXT NOT NULL,
    internal_folio TEXT,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    frequency TEXT NOT NULL DEFAULT 'biweekly' CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'special', 'other')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'authorized', 'paid', 'cancelled')),
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
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(company_id, folio)
);

-- 7. TABLA: Percepciones (receipt_earnings)
CREATE TABLE IF NOT EXISTS public.receipt_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES public.receipts(id) ON DELETE CASCADE,
    concept TEXT NOT NULL,
    reference TEXT,
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. TABLA: Deducciones (receipt_deductions)
CREATE TABLE IF NOT EXISTS public.receipt_deductions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES public.receipts(id) ON DELETE CASCADE,
    concept TEXT NOT NULL,
    reference TEXT,
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. TABLA: Enlaces Compartidos Temporales (share_links)
CREATE TABLE IF NOT EXISTS public.share_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES public.receipts(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT false,
    access_count INT NOT NULL DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. TABLA: Logs de Auditoría (audit_logs)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- ÍNDICES PARA BÚSQUEDAS EFICIENTES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_people_company_id ON public.people(company_id);
CREATE INDEX IF NOT EXISTS idx_people_status ON public.people(status);
CREATE INDEX IF NOT EXISTS idx_receipts_company_id ON public.receipts(company_id);
CREATE INDEX IF NOT EXISTS idx_receipts_person_id ON public.receipts(person_id);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON public.receipts(status);
CREATE INDEX IF NOT EXISTS idx_receipts_verification_code ON public.receipts(verification_code);
CREATE INDEX IF NOT EXISTS idx_share_links_token ON public.share_links(token);

-- ==============================================================================
-- FUNCIONES Y DISPARADORES (TRIGGERS)
-- ==============================================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_people_updated_at BEFORE UPDATE ON public.people FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_receipts_updated_at BEFORE UPDATE ON public.receipts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Función atómica para generar el siguiente folio por empresa
CREATE OR REPLACE FUNCTION public.get_next_folio(p_company_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_prefix TEXT;
    v_num INT;
    v_formatted_folio TEXT;
BEGIN
    -- Bloquear y obtener el número actual de folio de la empresa
    SELECT folio_prefix, next_folio_number 
    INTO v_prefix, v_num
    FROM public.companies
    WHERE id = p_company_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Empresa no encontrada';
    END IF;

    -- Formatear folio: ej. SYSS-2405-0789 o PREFIX-0001
    v_formatted_folio := v_prefix || '-' || to_char(now(), 'YYMM') || '-' || lpad(v_num::text, 4, '0');

    -- Incrementar contador
    UPDATE public.companies
    SET next_folio_number = next_folio_number + 1
    WHERE id = p_company_id;

    RETURN v_formatted_folio;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- SEGURIDAD A NIVEL DE FILAS (Row Level Security - RLS)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para Profiles
CREATE POLICY "Los usuarios pueden ver su propio perfil" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Políticas para Companies (solo miembros con acceso)
CREATE POLICY "Miembros pueden ver sus empresas" ON public.companies
    FOR SELECT USING (
        id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid())
        OR created_by = auth.uid()
    );

CREATE POLICY "Propietarios y administradores pueden modificar empresa" ON public.companies
    FOR UPDATE USING (
        id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
        OR created_by = auth.uid()
    );

-- Políticas para People (por empresa)
CREATE POLICY "Miembros pueden ver personas de su empresa" ON public.people
    FOR SELECT USING (
        company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Operadores y administradores pueden crear/modificar personas" ON public.people
    FOR ALL USING (
        company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'operator'))
    );

-- Políticas para Receipts
CREATE POLICY "Miembros pueden ver recibos de su empresa" ON public.receipts
    FOR SELECT USING (
        company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Operadores y administradores pueden gestionar recibos" ON public.receipts
    FOR ALL USING (
        company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'operator'))
    );

-- Políticas para Percepciones y Deducciones
CREATE POLICY "Miembros pueden ver percepciones" ON public.receipt_earnings
    FOR ALL USING (
        receipt_id IN (SELECT id FROM public.receipts WHERE company_id IN (
            SELECT company_id FROM public.company_members WHERE user_id = auth.uid()
        ))
    );

CREATE POLICY "Miembros pueden ver deducciones" ON public.receipt_deductions
    FOR ALL USING (
        receipt_id IN (SELECT id FROM public.receipts WHERE company_id IN (
            SELECT company_id FROM public.company_members WHERE user_id = auth.uid()
        ))
    );

-- Política de validación pública (para QR y Share links)
CREATE POLICY "Acceso público de sólo lectura para validación por código de verificación" ON public.receipts
    FOR SELECT USING (true);
