-- ==============================================================================
-- MIGRACIÓN 1: COMPATIBILIDAD DE AUTENTICACIÓN Y BOOTSTRAP (Transaccional)
-- Archivo: 20260820_auth_compatibility_bootstrap.sql
-- ==============================================================================

BEGIN;

-- 1. EXTENSIONES REQUERIDAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLA DE PERFILES DE USUARIO (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'operator', 'viewer')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS inmediatamente para que nunca quede abierta
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. TABLA DE MEMBRESÍAS MULTIEMPRESA (company_members)
-- company_id es TEXT para alinearse con public.companies(id)
-- user_id es UUID para alinearse con public.profiles(id)
CREATE TABLE IF NOT EXISTS public.company_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id TEXT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'operator', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(company_id, user_id)
);

-- Habilitar RLS inmediatamente
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- 4. ÍNDICES DE RENDIMIENTO PARA EVALUACIÓN RLS
CREATE INDEX IF NOT EXISTS idx_company_members_user_id ON public.company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_company_id ON public.company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user_company ON public.company_members(user_id, company_id);
CREATE INDEX IF NOT EXISTS idx_companies_created_by ON public.companies(created_by);
CREATE INDEX IF NOT EXISTS idx_people_company_id ON public.people(company_id);
CREATE INDEX IF NOT EXISTS idx_receipts_company_id ON public.receipts(company_id);
CREATE INDEX IF NOT EXISTS idx_receipts_verification_code ON public.receipts(verification_code);
CREATE INDEX IF NOT EXISTS idx_share_links_token ON public.share_links(token);

-- 5. TRIGGER PARA AUTO-CREACIÓN DE PERFILES AL REGISTRAR EN AUTH.USERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        pg_catalog.coalesce(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Usuario'),
        NEW.email,
        'viewer'
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        full_name = pg_catalog.coalesce(EXCLUDED.full_name, public.profiles.full_name),
        updated_at = pg_catalog.now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. PROTECCIÓN CONTRA AUTOESCALACIÓN DE PRIVILEGIOS EN PROFILES
REVOKE ALL ON TABLE public.profiles FROM anon;
REVOKE ALL ON TABLE public.company_members FROM anon;

-- Conceder SELECT a authenticated
GRANT SELECT ON TABLE public.profiles TO authenticated;

-- Revocar UPDATE general y concederlo SOLO en columnas no privilegiadas
REVOKE UPDATE ON TABLE public.profiles FROM authenticated;
GRANT UPDATE (full_name, avatar_url, updated_at) ON TABLE public.profiles TO authenticated;

-- 7. FUNCIONES AUXILIARES SECURITY DEFINER PARA EVITAR RECURSIÓN INFINITA EN RLS
CREATE OR REPLACE FUNCTION public.is_company_member(p_company_id TEXT, p_roles TEXT[] DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL OR p_company_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Comprobar si es creador registrado en la tabla companies
    IF EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = p_company_id 
          AND c.created_by = v_user_id::text
          AND (p_roles IS NULL OR 'owner' = ANY(p_roles) OR 'admin' = ANY(p_roles))
    ) THEN
        RETURN TRUE;
    END IF;

    -- Comprobar membresía en company_members
    IF p_roles IS NULL THEN
        RETURN EXISTS (
            SELECT 1 FROM public.company_members cm
            WHERE cm.company_id = p_company_id 
              AND cm.user_id = v_user_id
        );
    ELSE
        RETURN EXISTS (
            SELECT 1 FROM public.company_members cm
            WHERE cm.company_id = p_company_id 
              AND cm.user_id = v_user_id
              AND cm.role = ANY(p_roles)
        );
    END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.is_company_creator(p_company_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL OR p_company_id IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = p_company_id 
          AND c.created_by = v_user_id::text
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.is_receipt_company_member(p_receipt_id TEXT, p_roles TEXT[] DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_company_id TEXT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL OR p_receipt_id IS NULL THEN
        RETURN FALSE;
    END IF;

    SELECT r.company_id INTO v_company_id
    FROM public.receipts r
    WHERE r.id = p_receipt_id;

    IF v_company_id IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN public.is_company_member(v_company_id, p_roles);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

-- 8. TRIGGER DE PROTECCIÓN DEL ÚLTIMO PROPIETARIO (OWNER)
CREATE OR REPLACE FUNCTION public.prevent_last_owner_removal()
RETURNS TRIGGER AS $$
DECLARE
    v_owner_count INT;
BEGIN
    IF OLD.role = 'owner' THEN
        IF (TG_OP = 'DELETE') OR (TG_OP = 'UPDATE' AND NEW.role <> 'owner') THEN
            SELECT count(*) INTO v_owner_count
            FROM public.company_members cm
            WHERE cm.company_id = OLD.company_id
              AND cm.role = 'owner'
              AND cm.id <> OLD.id;

            IF v_owner_count < 1 THEN
                RAISE EXCEPTION 'No se puede eliminar o degradar al último propietario de la empresa';
            END IF;
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP TRIGGER IF EXISTS prevent_last_owner_removal_trigger ON public.company_members;
CREATE TRIGGER prevent_last_owner_removal_trigger
    BEFORE UPDATE OR DELETE ON public.company_members
    FOR EACH ROW EXECUTE FUNCTION public.prevent_last_owner_removal();

-- 9. PERMISOS MÍNIMOS DE EJECUCIÓN SOBRE FUNCIONES AUXILIARES
REVOKE EXECUTE ON FUNCTION public.is_company_member(TEXT, TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_company_member(TEXT, TEXT[]) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_company_creator(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_company_creator(TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_receipt_company_member(TEXT, TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_receipt_company_member(TEXT, TEXT[]) TO authenticated;

COMMIT;
