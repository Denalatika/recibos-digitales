-- ==============================================================================
-- MIGRACIÓN 2: ENDURECIMIENTO DE SEGURIDAD Y POLÍTICAS RLS (Transaccional)
-- Archivo: 20260820_security_and_rls_hardening.sql
-- Ejecutar DESPUÉS de 20260820_auth_compatibility_bootstrap.sql
-- ==============================================================================

BEGIN;

-- 1. REVOCAR PERMISOS DIRECTOS A ROL ANÓNIMO SOBRE TABLAS PRIVADAS
REVOKE ALL ON TABLE public.companies FROM anon;
REVOKE ALL ON TABLE public.people FROM anon;
REVOKE ALL ON TABLE public.receipts FROM anon;
REVOKE ALL ON TABLE public.receipt_earnings FROM anon;
REVOKE ALL ON TABLE public.receipt_deductions FROM anon;
REVOKE ALL ON TABLE public.share_links FROM anon;
REVOKE ALL ON TABLE public.profiles FROM anon;
REVOKE ALL ON TABLE public.company_members FROM anon;

-- 2. ELIMINAR POLÍTICAS ANTERIORES PARA APLICAR LAS NUEVAS SIN CONFLICTOS
DROP POLICY IF EXISTS "Acceso completo a companies" ON public.companies;
DROP POLICY IF EXISTS "Acceso completo a people" ON public.people;
DROP POLICY IF EXISTS "Acceso completo a receipts" ON public.receipts;
DROP POLICY IF EXISTS "Acceso completo a receipt_earnings" ON public.receipt_earnings;
DROP POLICY IF EXISTS "Acceso completo a receipt_deductions" ON public.receipt_deductions;
DROP POLICY IF EXISTS "Acceso completo a share_links" ON public.share_links;
DROP POLICY IF EXISTS "Acceso público de sólo lectura para validación por código de verificación" ON public.receipts;

DROP POLICY IF EXISTS "Usuarios autenticados pueden ver sus empresas" ON public.companies;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear empresas" ON public.companies;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar sus empresas" ON public.companies;
DROP POLICY IF EXISTS "Propietarios pueden eliminar sus empresas" ON public.companies;
DROP POLICY IF EXISTS "Miembros pueden ver sus empresas" ON public.companies;
DROP POLICY IF EXISTS "Administradores pueden actualizar sus empresas" ON public.companies;

DROP POLICY IF EXISTS "Usuarios autenticados pueden ver personas de su empresa" ON public.people;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear personas en su empresa" ON public.people;
DROP POLICY IF EXISTS "Usuarios autenticados pueden modificar personas de su empresa" ON public.people;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar personas de su empresa" ON public.people;
DROP POLICY IF EXISTS "Miembros pueden ver colaboradores" ON public.people;
DROP POLICY IF EXISTS "Operadores y administradores pueden crear colaboradores" ON public.people;
DROP POLICY IF EXISTS "Operadores y administradores pueden modificar colaboradores" ON public.people;
DROP POLICY IF EXISTS "Administradores pueden eliminar colaboradores" ON public.people;

DROP POLICY IF EXISTS "Usuarios autenticados pueden ver recibos de su empresa" ON public.receipts;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear recibos en su empresa" ON public.receipts;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar recibos de su empresa" ON public.receipts;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar recibos de su empresa" ON public.receipts;
DROP POLICY IF EXISTS "Miembros pueden ver recibos" ON public.receipts;
DROP POLICY IF EXISTS "Operadores y administradores pueden crear recibos" ON public.receipts;
DROP POLICY IF EXISTS "Operadores y administradores pueden modificar recibos" ON public.receipts;
DROP POLICY IF EXISTS "Administradores pueden eliminar recibos" ON public.receipts;

DROP POLICY IF EXISTS "Acceso a percepciones por miembros de la empresa" ON public.receipt_earnings;
DROP POLICY IF EXISTS "Acceso a deducciones por miembros de la empresa" ON public.receipt_deductions;
DROP POLICY IF EXISTS "Gestión de enlaces compartidos por miembros" ON public.share_links;
DROP POLICY IF EXISTS "Miembros pueden ver percepciones" ON public.receipt_earnings;
DROP POLICY IF EXISTS "Operadores pueden gestionar percepciones" ON public.receipt_earnings;
DROP POLICY IF EXISTS "Operadores pueden actualizar percepciones" ON public.receipt_earnings;
DROP POLICY IF EXISTS "Operadores pueden eliminar percepciones" ON public.receipt_earnings;
DROP POLICY IF EXISTS "Miembros pueden ver deducciones" ON public.receipt_deductions;
DROP POLICY IF EXISTS "Operadores pueden gestionar deducciones" ON public.receipt_deductions;
DROP POLICY IF EXISTS "Operadores pueden actualizar deducciones" ON public.receipt_deductions;
DROP POLICY IF EXISTS "Operadores pueden eliminar deducciones" ON public.receipt_deductions;
DROP POLICY IF EXISTS "Miembros pueden ver enlaces compartidos" ON public.share_links;
DROP POLICY IF EXISTS "Operadores pueden crear enlaces compartidos" ON public.share_links;
DROP POLICY IF EXISTS "Operadores pueden actualizar enlaces compartidos" ON public.share_links;
DROP POLICY IF EXISTS "Administradores pueden eliminar enlaces compartidos" ON public.share_links;

DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus datos de perfil" ON public.profiles;

DROP POLICY IF EXISTS "Usuarios pueden ver membresías de sus empresas" ON public.company_members;
DROP POLICY IF EXISTS "Administradores pueden gestionar miembros" ON public.company_members;
DROP POLICY IF EXISTS "Miembros pueden ver miembros de su empresa" ON public.company_members;
DROP POLICY IF EXISTS "Administradores pueden agregar miembros" ON public.company_members;
DROP POLICY IF EXISTS "Administradores pueden modificar miembros" ON public.company_members;
DROP POLICY IF EXISTS "Administradores pueden eliminar miembros" ON public.company_members;

DROP POLICY IF EXISTS "Acceso público lectura a receipt-assets" ON storage.objects;
DROP POLICY IF EXISTS "Acceso público subida a receipt-assets" ON storage.objects;
DROP POLICY IF EXISTS "Acceso público actualización a receipt-assets" ON storage.objects;
DROP POLICY IF EXISTS "Acceso público eliminación a receipt-assets" ON storage.objects;
DROP POLICY IF EXISTS "Lectura pública de logos y firmas" ON storage.objects;
DROP POLICY IF EXISTS "Lectura pública de logos y membretes" ON storage.objects;
DROP POLICY IF EXISTS "Lectura pública de logos y membretes en company-public-assets" ON storage.objects;
DROP POLICY IF EXISTS "Subida de logos por miembros de empresa" ON storage.objects;
DROP POLICY IF EXISTS "Modificación de logos por administradores" ON storage.objects;
DROP POLICY IF EXISTS "Eliminación de logos por administradores" ON storage.objects;
DROP POLICY IF EXISTS "Lectura privada restringida a miembros de la empresa" ON storage.objects;
DROP POLICY IF EXISTS "Subida privada restringida a miembros de la empresa" ON storage.objects;
DROP POLICY IF EXISTS "Modificación privada restringida a administradores" ON storage.objects;
DROP POLICY IF EXISTS "Eliminación privada restringida a propietarios" ON storage.objects;

-- 3. HABILITACIÓN DE RLS EN TODAS LAS TABLAS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 4. POLÍTICAS RLS PARA PERFILES (PROFILES)
-- ==============================================================================
CREATE POLICY "Usuarios pueden ver su propio perfil" ON public.profiles
    FOR SELECT TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Usuarios pueden actualizar sus datos de perfil" ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- ==============================================================================
-- 5. POLÍTICAS RLS PARA MEMBRESÍAS (COMPANY_MEMBERS)
-- Sin subconsultas recursivas: Delega en public.is_company_member (SECURITY DEFINER)
-- ==============================================================================
-- Consulta: El usuario puede ver su propia membresía o las de las empresas donde participa
CREATE POLICY "Miembros pueden ver miembros de su empresa" ON public.company_members
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid()
        OR public.is_company_member(company_id, NULL)
    );

-- Inserción: Owner puede asignar cualquier rol. Admin puede asignar solo admin, operator o viewer (NO owner)
CREATE POLICY "Administradores pueden agregar miembros" ON public.company_members
    FOR INSERT TO authenticated
    WITH CHECK (
        (public.is_company_member(company_id, ARRAY['owner']))
        OR
        (public.is_company_member(company_id, ARRAY['admin']) AND role <> 'owner')
    );

-- Modificación: Owner puede modificar cualquier membresía. Admin solo filas que NO sean owner y NO puede elevar a owner
CREATE POLICY "Administradores pueden modificar miembros" ON public.company_members
    FOR UPDATE TO authenticated
    USING (
        (public.is_company_member(company_id, ARRAY['owner']))
        OR
        (public.is_company_member(company_id, ARRAY['admin']) AND role <> 'owner')
    )
    WITH CHECK (
        (public.is_company_member(company_id, ARRAY['owner']))
        OR
        (public.is_company_member(company_id, ARRAY['admin']) AND role <> 'owner')
    );

-- Eliminación: Owner puede eliminar cualquier miembro (salvo el último owner, protegido por trigger). Admin solo miembros no-owner
CREATE POLICY "Administradores pueden eliminar miembros" ON public.company_members
    FOR DELETE TO authenticated
    USING (
        (public.is_company_member(company_id, ARRAY['owner']))
        OR
        (public.is_company_member(company_id, ARRAY['admin']) AND role <> 'owner')
    );

-- ==============================================================================
-- 6. POLÍTICAS RLS PARA EMPRESAS (COMPANIES)
-- ==============================================================================
CREATE POLICY "Miembros pueden ver sus empresas" ON public.companies
    FOR SELECT TO authenticated
    USING (
        created_by = auth.uid()::text 
        OR public.is_company_member(id, NULL)
    );

CREATE POLICY "Usuarios autenticados pueden crear empresas" ON public.companies
    FOR INSERT TO authenticated
    WITH CHECK (
        created_by = auth.uid()::text
    );

CREATE POLICY "Administradores pueden actualizar sus empresas" ON public.companies
    FOR UPDATE TO authenticated
    USING (
        created_by = auth.uid()::text 
        OR public.is_company_member(id, ARRAY['owner', 'admin'])
    )
    WITH CHECK (
        created_by = auth.uid()::text 
        OR public.is_company_member(id, ARRAY['owner', 'admin'])
    );

CREATE POLICY "Propietarios pueden eliminar sus empresas" ON public.companies
    FOR DELETE TO authenticated
    USING (
        created_by = auth.uid()::text 
        OR public.is_company_member(id, ARRAY['owner'])
    );

-- ==============================================================================
-- 7. POLÍTICAS RLS PARA PERSONAS / COLABORADORES (PEOPLE)
-- ==============================================================================
CREATE POLICY "Miembros pueden ver colaboradores" ON public.people
    FOR SELECT TO authenticated
    USING (
        public.is_company_member(company_id, NULL)
    );

CREATE POLICY "Operadores y administradores pueden crear colaboradores" ON public.people
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_company_member(company_id, ARRAY['owner', 'admin', 'operator'])
    );

CREATE POLICY "Operadores y administradores pueden modificar colaboradores" ON public.people
    FOR UPDATE TO authenticated
    USING (
        public.is_company_member(company_id, ARRAY['owner', 'admin', 'operator'])
    )
    WITH CHECK (
        public.is_company_member(company_id, ARRAY['owner', 'admin', 'operator'])
    );

CREATE POLICY "Administradores pueden eliminar colaboradores" ON public.people
    FOR DELETE TO authenticated
    USING (
        public.is_company_member(company_id, ARRAY['owner', 'admin'])
    );

-- ==============================================================================
-- 8. POLÍTICAS RLS PARA RECIBOS (RECEIPTS)
-- ==============================================================================
CREATE POLICY "Miembros pueden ver recibos" ON public.receipts
    FOR SELECT TO authenticated
    USING (
        public.is_company_member(company_id, NULL)
    );

CREATE POLICY "Operadores y administradores pueden crear recibos" ON public.receipts
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_company_member(company_id, ARRAY['owner', 'admin', 'operator'])
    );

CREATE POLICY "Operadores y administradores pueden modificar recibos" ON public.receipts
    FOR UPDATE TO authenticated
    USING (
        public.is_company_member(company_id, ARRAY['owner', 'admin', 'operator'])
    )
    WITH CHECK (
        public.is_company_member(company_id, ARRAY['owner', 'admin', 'operator'])
    );

CREATE POLICY "Administradores pueden eliminar recibos" ON public.receipts
    FOR DELETE TO authenticated
    USING (
        public.is_company_member(company_id, ARRAY['owner', 'admin'])
    );

-- ==============================================================================
-- 9. POLÍTICAS RLS PARA PERCEPCIONES Y DEDUCCIONES
-- ==============================================================================
CREATE POLICY "Miembros pueden ver percepciones" ON public.receipt_earnings
    FOR SELECT TO authenticated
    USING (
        public.is_receipt_company_member(receipt_id, NULL)
    );

CREATE POLICY "Operadores pueden gestionar percepciones" ON public.receipt_earnings
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_receipt_company_member(receipt_id, ARRAY['owner', 'admin', 'operator'])
    );

CREATE POLICY "Operadores pueden actualizar percepciones" ON public.receipt_earnings
    FOR UPDATE TO authenticated
    USING (
        public.is_receipt_company_member(receipt_id, ARRAY['owner', 'admin', 'operator'])
    )
    WITH CHECK (
        public.is_receipt_company_member(receipt_id, ARRAY['owner', 'admin', 'operator'])
    );

CREATE POLICY "Operadores pueden eliminar percepciones" ON public.receipt_earnings
    FOR DELETE TO authenticated
    USING (
        public.is_receipt_company_member(receipt_id, ARRAY['owner', 'admin', 'operator'])
    );

CREATE POLICY "Miembros pueden ver deducciones" ON public.receipt_deductions
    FOR SELECT TO authenticated
    USING (
        public.is_receipt_company_member(receipt_id, NULL)
    );

CREATE POLICY "Operadores pueden gestionar deducciones" ON public.receipt_deductions
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_receipt_company_member(receipt_id, ARRAY['owner', 'admin', 'operator'])
    );

CREATE POLICY "Operadores pueden actualizar deducciones" ON public.receipt_deductions
    FOR UPDATE TO authenticated
    USING (
        public.is_receipt_company_member(receipt_id, ARRAY['owner', 'admin', 'operator'])
    )
    WITH CHECK (
        public.is_receipt_company_member(receipt_id, ARRAY['owner', 'admin', 'operator'])
    );

CREATE POLICY "Operadores pueden eliminar deducciones" ON public.receipt_deductions
    FOR DELETE TO authenticated
    USING (
        public.is_receipt_company_member(receipt_id, ARRAY['owner', 'admin', 'operator'])
    );

-- ==============================================================================
-- 10. POLÍTICAS RLS PARA ENLACES COMPARTIDOS (SHARE_LINKS)
-- ==============================================================================
CREATE POLICY "Miembros pueden ver enlaces compartidos" ON public.share_links
    FOR SELECT TO authenticated
    USING (
        public.is_receipt_company_member(receipt_id, NULL)
    );

CREATE POLICY "Operadores pueden crear enlaces compartidos" ON public.share_links
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_receipt_company_member(receipt_id, ARRAY['owner', 'admin', 'operator'])
    );

CREATE POLICY "Operadores pueden actualizar enlaces compartidos" ON public.share_links
    FOR UPDATE TO authenticated
    USING (
        public.is_receipt_company_member(receipt_id, ARRAY['owner', 'admin', 'operator'])
    )
    WITH CHECK (
        public.is_receipt_company_member(receipt_id, ARRAY['owner', 'admin', 'operator'])
    );

CREATE POLICY "Administradores pueden eliminar enlaces compartidos" ON public.share_links
    FOR DELETE TO authenticated
    USING (
        public.is_receipt_company_member(receipt_id, ARRAY['owner', 'admin'])
    );

-- ==============================================================================
-- 11. FUNCIÓN SEGURA PARA VALIDACIÓN PÚBLICA POR CÓDIGO QR (RPC)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_receipt_public_validation(p_code TEXT)
RETURNS JSON AS $$
DECLARE
    v_receipt RECORD;
    v_company RECORD;
    v_result JSON;
BEGIN
    SELECT r.id, r.company_id, r.folio, r.internal_folio, r.receipt_type, r.payment_date, r.status, r.verification_code
    INTO v_receipt
    FROM public.receipts r
    WHERE pg_catalog.upper(pg_catalog.btrim(r.verification_code)) = pg_catalog.upper(pg_catalog.btrim(p_code))
      AND r.deleted_at IS NULL;

    IF NOT FOUND THEN
        RETURN pg_catalog.json_build_object(
            'is_valid', false,
            'message', 'Código de verificación no encontrado o inválido.'
        );
    END IF;

    SELECT c.name, c.business_name
    INTO v_company
    FROM public.companies c
    WHERE c.id = v_receipt.company_id;

    v_result := pg_catalog.json_build_object(
        'is_valid', true,
        'company_name', COALESCE(v_company.business_name, v_company.name, 'Empresa Emisora'),
        'folio', v_receipt.folio,
        'internal_folio', v_receipt.internal_folio,
        'receipt_type', v_receipt.receipt_type,
        'payment_date', v_receipt.payment_date,
        'status', v_receipt.status,
        'verification_code', v_receipt.verification_code
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.get_receipt_public_validation(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_receipt_public_validation(TEXT) TO anon, authenticated;

-- ==============================================================================
-- 12. FUNCIÓN SEGURA PARA CONSULTA DE ENLACES COMPARTIDOS VÁLIDOS (RPC)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_shared_receipt(p_token TEXT)
RETURNS JSON AS $$
DECLARE
    v_link RECORD;
    v_receipt RECORD;
    v_company RECORD;
    v_person RECORD;
    v_earnings JSON;
    v_deductions JSON;
BEGIN
    SELECT expires_at, is_revoked, id, receipt_id INTO v_link
    FROM public.share_links
    WHERE token = p_token
      AND is_revoked = false
      AND expires_at > pg_catalog.now();

    IF NOT FOUND THEN
        RETURN pg_catalog.json_build_object('is_valid', false, 'message', 'Enlace expirado o no válido.');
    END IF;

    UPDATE public.share_links
    SET access_count = access_count + 1
    WHERE id = v_link.id;

    SELECT * INTO v_receipt FROM public.receipts WHERE id = v_link.receipt_id AND deleted_at IS NULL;
    IF NOT FOUND THEN
        RETURN pg_catalog.json_build_object('is_valid', false, 'message', 'Recibo no encontrado.');
    END IF;

    SELECT name, business_name, rfc, address, phone, email, logo_url, slogan, primary_color, secondary_color, accent_color
    INTO v_company 
    FROM public.companies WHERE id = v_receipt.company_id;

    SELECT full_name, internal_id, department, position, rfc, contract_type, bank_name, bank_account_masked
    INTO v_person 
    FROM public.people WHERE id = v_receipt.person_id;

    SELECT COALESCE(
        pg_catalog.json_agg(
            pg_catalog.json_build_object(
                'concept', e.concept,
                'reference', e.reference,
                'amount', e.amount,
                'display_order', e.display_order
            ) ORDER BY e.display_order
        ), '[]'::json
    ) INTO v_earnings
    FROM public.receipt_earnings e WHERE e.receipt_id = v_receipt.id;

    SELECT COALESCE(
        pg_catalog.json_agg(
            pg_catalog.json_build_object(
                'concept', d.concept,
                'reference', d.reference,
                'amount', d.amount,
                'display_order', d.display_order
            ) ORDER BY d.display_order
        ), '[]'::json
    ) INTO v_deductions
    FROM public.receipt_deductions d WHERE d.receipt_id = v_receipt.id;

    RETURN pg_catalog.json_build_object(
        'is_valid', true,
        'link', pg_catalog.json_build_object(
            'expires_at', v_link.expires_at,
            'is_revoked', v_link.is_revoked
        ),
        'receipt', pg_catalog.json_build_object(
            'folio', v_receipt.folio,
            'internal_folio', v_receipt.internal_folio,
            'issue_date', v_receipt.issue_date,
            'payment_date', v_receipt.payment_date,
            'period_start', v_receipt.period_start,
            'period_end', v_receipt.period_end,
            'frequency', v_receipt.frequency,
            'status', v_receipt.status,
            'currency', v_receipt.currency,
            'payment_method', v_receipt.payment_method,
            'bank_name', v_receipt.bank_name,
            'bank_account_masked', v_receipt.bank_account_masked,
            'deposit_date', v_receipt.deposit_date,
            'verification_code', v_receipt.verification_code,
            'signer_name', v_receipt.signer_name,
            'signer_role', v_receipt.signer_role,
            'notes', v_receipt.notes,
            'total_earnings', v_receipt.total_earnings,
            'total_deductions', v_receipt.total_deductions,
            'net_total', v_receipt.net_total,
            'company', pg_catalog.row_to_json(v_company),
            'person', pg_catalog.row_to_json(v_person),
            'earnings', v_earnings,
            'deductions', v_deductions
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.get_shared_receipt(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_receipt(TEXT) TO anon, authenticated;

-- ==============================================================================
-- 13. FUNCIÓN ATÓMICA DE FOLIOS CON COMPROBACIÓN DE AUTORIZACIÓN
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_next_folio(p_company_id TEXT)
RETURNS TEXT AS $$
DECLARE
    v_prefix TEXT;
    v_num INT;
    v_formatted_folio TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;

    IF NOT public.is_company_member(p_company_id, ARRAY['owner', 'admin', 'operator']) THEN
        RAISE EXCEPTION 'No autorizado para generar folios de esta empresa';
    END IF;

    SELECT folio_prefix, next_folio_number 
    INTO v_prefix, v_num
    FROM public.companies
    WHERE id = p_company_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Empresa no encontrada';
    END IF;

    v_formatted_folio := v_prefix || '-' || pg_catalog.to_char(pg_catalog.now(), 'YYMM') || '-' || pg_catalog.lpad(v_num::text, 4, '0');

    UPDATE public.companies
    SET next_folio_number = next_folio_number + 1
    WHERE id = p_company_id;

    RETURN v_formatted_folio;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.get_next_folio(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_next_folio(TEXT) TO authenticated;

-- ==============================================================================
-- 14. POLÍTICAS DE ALMACENAMIENTO (STORAGE) CON AISLAMIENTO MULTIEMPRESA
-- ==============================================================================
-- 14.1. BUCKET PÚBLICO: company-public-assets (public = true)
CREATE POLICY "Subida de logos por miembros de empresa" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'company-public-assets'
        AND public.is_company_member(pg_catalog.split_part(name, '/', 1), ARRAY['owner', 'admin', 'operator'])
        AND pg_catalog.split_part(name, '/', 2) IN ('logos', 'letterheads')
    );

CREATE POLICY "Modificación de logos por administradores" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'company-public-assets'
        AND public.is_company_member(pg_catalog.split_part(name, '/', 1), ARRAY['owner', 'admin'])
        AND pg_catalog.split_part(name, '/', 2) IN ('logos', 'letterheads')
    )
    WITH CHECK (
        bucket_id = 'company-public-assets'
        AND public.is_company_member(pg_catalog.split_part(name, '/', 1), ARRAY['owner', 'admin'])
        AND pg_catalog.split_part(name, '/', 2) IN ('logos', 'letterheads')
    );

CREATE POLICY "Eliminación de logos por administradores" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'company-public-assets'
        AND public.is_company_member(pg_catalog.split_part(name, '/', 1), ARRAY['owner', 'admin'])
        AND pg_catalog.split_part(name, '/', 2) IN ('logos', 'letterheads')
    );

-- 14.2. BUCKET PRIVADO: receipt-private-assets (public = false)
CREATE POLICY "Lectura privada restringida a miembros de la empresa" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'receipt-private-assets'
        AND public.is_company_member(pg_catalog.split_part(name, '/', 1), NULL)
    );

CREATE POLICY "Subida privada restringida a miembros de la empresa" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'receipt-private-assets'
        AND public.is_company_member(pg_catalog.split_part(name, '/', 1), ARRAY['owner', 'admin', 'operator'])
    );

CREATE POLICY "Modificación privada restringida a administradores" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'receipt-private-assets'
        AND public.is_company_member(pg_catalog.split_part(name, '/', 1), ARRAY['owner', 'admin'])
    )
    WITH CHECK (
        bucket_id = 'receipt-private-assets'
        AND public.is_company_member(pg_catalog.split_part(name, '/', 1), ARRAY['owner', 'admin'])
    );

CREATE POLICY "Eliminación privada restringida a propietarios" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'receipt-private-assets'
        AND public.is_company_member(pg_catalog.split_part(name, '/', 1), ARRAY['owner'])
    );

COMMIT;
