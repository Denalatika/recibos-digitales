-- ==============================================================================
-- MIGRACIÓN DE ENDURECIMIENTO DE SEGURIDAD Y POLÍTICAS RLS (PostgreSQL / Supabase)
-- Archivo: 20260820_security_and_rls_hardening.sql
-- ==============================================================================

-- 1. REVOCAR PERMISOS DIRECTOS A ROL ANÓNIMO SOBRE TABLAS PRIVADAS
REVOKE ALL ON TABLE public.companies FROM anon;
REVOKE ALL ON TABLE public.people FROM anon;
REVOKE ALL ON TABLE public.receipts FROM anon;
REVOKE ALL ON TABLE public.receipt_earnings FROM anon;
REVOKE ALL ON TABLE public.receipt_deductions FROM anon;
REVOKE ALL ON TABLE public.share_links FROM anon;
REVOKE ALL ON TABLE public.profiles FROM anon;
REVOKE ALL ON TABLE public.company_members FROM anon;

-- 2. ELIMINAR TODAS LAS POLÍTICAS INSEGURAS O PÚBLICAS ANTERIORES
DROP POLICY IF EXISTS "Acceso completo a companies" ON public.companies;
DROP POLICY IF EXISTS "Acceso completo a people" ON public.people;
DROP POLICY IF EXISTS "Acceso completo a receipts" ON public.receipts;
DROP POLICY IF EXISTS "Acceso completo a receipt_earnings" ON public.receipt_earnings;
DROP POLICY IF EXISTS "Acceso completo a receipt_deductions" ON public.receipt_deductions;
DROP POLICY IF EXISTS "Acceso completo a share_links" ON public.share_links;
DROP POLICY IF EXISTS "Acceso público de sólo lectura para validación por código de verificación" ON public.receipts;
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

-- 3. ASEGURAR QUE RLS ESTÉ HABILITADO EN TODAS LAS TABLAS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS PARA PERFILES (PROFILES)
-- Los usuarios solo pueden ver y actualizar su propio perfil. No pueden autoasignarse roles privilegiados.
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON public.profiles;
CREATE POLICY "Usuarios pueden ver su propio perfil" ON public.profiles
    FOR SELECT TO authenticated
    USING (id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Usuarios pueden actualizar su perfil" ON public.profiles;
CREATE POLICY "Usuarios pueden actualizar su perfil" ON public.profiles
    FOR UPDATE TO authenticated
    USING (id::text = auth.uid()::text)
    WITH CHECK (id::text = auth.uid()::text);

-- 5. POLÍTICAS ESTRICTAS PARA EMPRESAS (COMPANIES)
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver sus empresas" ON public.companies;
CREATE POLICY "Usuarios autenticados pueden ver sus empresas" ON public.companies
    FOR SELECT TO authenticated
    USING (
        created_by = auth.uid()::text 
        OR id IN (
            SELECT company_id FROM public.company_members 
            WHERE user_id::text = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Usuarios autenticados pueden crear empresas" ON public.companies;
CREATE POLICY "Usuarios autenticados pueden crear empresas" ON public.companies
    FOR INSERT TO authenticated
    WITH CHECK (
        created_by = auth.uid()::text 
        OR created_by IS NULL
    );

DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar sus empresas" ON public.companies;
CREATE POLICY "Usuarios autenticados pueden actualizar sus empresas" ON public.companies
    FOR UPDATE TO authenticated
    USING (
        created_by = auth.uid()::text 
        OR id IN (
            SELECT company_id FROM public.company_members 
            WHERE user_id::text = auth.uid()::text AND role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        created_by = auth.uid()::text 
        OR id IN (
            SELECT company_id FROM public.company_members 
            WHERE user_id::text = auth.uid()::text AND role IN ('owner', 'admin')
        )
    );

DROP POLICY IF EXISTS "Propietarios pueden eliminar sus empresas" ON public.companies;
CREATE POLICY "Propietarios pueden eliminar sus empresas" ON public.companies
    FOR DELETE TO authenticated
    USING (
        created_by = auth.uid()::text 
        OR id IN (
            SELECT company_id FROM public.company_members 
            WHERE user_id::text = auth.uid()::text AND role = 'owner'
        )
    );

-- 6. POLÍTICAS ESTRICTAS PARA PERSONAS / COLABORADORES (PEOPLE)
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver personas de su empresa" ON public.people;
CREATE POLICY "Usuarios autenticados pueden ver personas de su empresa" ON public.people
    FOR SELECT TO authenticated
    USING (
        company_id IN (
            SELECT id FROM public.companies WHERE created_by = auth.uid()::text
            UNION
            SELECT company_id FROM public.company_members WHERE user_id::text = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Usuarios autenticados pueden crear personas en su empresa" ON public.people;
CREATE POLICY "Usuarios autenticados pueden crear personas en su empresa" ON public.people
    FOR INSERT TO authenticated
    WITH CHECK (
        company_id IN (
            SELECT id FROM public.companies WHERE created_by = auth.uid()::text
            UNION
            SELECT company_id FROM public.company_members WHERE user_id::text = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Usuarios autenticados pueden modificar personas de su empresa" ON public.people;
CREATE POLICY "Usuarios autenticados pueden modificar personas de su empresa" ON public.people
    FOR UPDATE TO authenticated
    USING (
        company_id IN (
            SELECT id FROM public.companies WHERE created_by = auth.uid()::text
            UNION
            SELECT company_id FROM public.company_members WHERE user_id::text = auth.uid()::text
        )
    )
    WITH CHECK (
        company_id IN (
            SELECT id FROM public.companies WHERE created_by = auth.uid()::text
            UNION
            SELECT company_id FROM public.company_members WHERE user_id::text = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar personas de su empresa" ON public.people;
CREATE POLICY "Usuarios autenticados pueden eliminar personas de su empresa" ON public.people
    FOR DELETE TO authenticated
    USING (
        company_id IN (
            SELECT id FROM public.companies WHERE created_by = auth.uid()::text
            UNION
            SELECT company_id FROM public.company_members WHERE user_id::text = auth.uid()::text
        )
    );

-- 7. POLÍTICAS ESTRICTAS PARA RECIBOS (RECEIPTS)
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver recibos de su empresa" ON public.receipts;
CREATE POLICY "Usuarios autenticados pueden ver recibos de su empresa" ON public.receipts
    FOR SELECT TO authenticated
    USING (
        company_id IN (
            SELECT id FROM public.companies WHERE created_by = auth.uid()::text
            UNION
            SELECT company_id FROM public.company_members WHERE user_id::text = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Usuarios autenticados pueden crear recibos en su empresa" ON public.receipts;
CREATE POLICY "Usuarios autenticados pueden crear recibos en su empresa" ON public.receipts
    FOR INSERT TO authenticated
    WITH CHECK (
        company_id IN (
            SELECT id FROM public.companies WHERE created_by = auth.uid()::text
            UNION
            SELECT company_id FROM public.company_members WHERE user_id::text = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar recibos de su empresa" ON public.receipts;
CREATE POLICY "Usuarios autenticados pueden actualizar recibos de su empresa" ON public.receipts
    FOR UPDATE TO authenticated
    USING (
        company_id IN (
            SELECT id FROM public.companies WHERE created_by = auth.uid()::text
            UNION
            SELECT company_id FROM public.company_members WHERE user_id::text = auth.uid()::text
        )
    )
    WITH CHECK (
        company_id IN (
            SELECT id FROM public.companies WHERE created_by = auth.uid()::text
            UNION
            SELECT company_id FROM public.company_members WHERE user_id::text = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar recibos de su empresa" ON public.receipts;
CREATE POLICY "Usuarios autenticados pueden eliminar recibos de su empresa" ON public.receipts
    FOR DELETE TO authenticated
    USING (
        company_id IN (
            SELECT id FROM public.companies WHERE created_by = auth.uid()::text
            UNION
            SELECT company_id FROM public.company_members WHERE user_id::text = auth.uid()::text
        )
    );

-- 8. POLÍTICAS ESTRICTAS PARA PERCEPCIONES Y DEDUCCIONES
DROP POLICY IF EXISTS "Acceso a percepciones por miembros de la empresa" ON public.receipt_earnings;
CREATE POLICY "Acceso a percepciones por miembros de la empresa" ON public.receipt_earnings
    FOR ALL TO authenticated
    USING (
        receipt_id IN (
            SELECT id FROM public.receipts WHERE company_id IN (
                SELECT id FROM public.companies WHERE created_by = auth.uid()::text
                UNION
                SELECT company_id FROM public.company_members WHERE user_id::text = auth.uid()::text
            )
        )
    )
    WITH CHECK (
        receipt_id IN (
            SELECT id FROM public.receipts WHERE company_id IN (
                SELECT id FROM public.companies WHERE created_by = auth.uid()::text
                UNION
                SELECT company_id FROM public.company_members WHERE user_id::text = auth.uid()::text
            )
        )
    );

DROP POLICY IF EXISTS "Acceso a deducciones por miembros de la empresa" ON public.receipt_deductions;
CREATE POLICY "Acceso a deducciones por miembros de la empresa" ON public.receipt_deductions
    FOR ALL TO authenticated
    USING (
        receipt_id IN (
            SELECT id FROM public.receipts WHERE company_id IN (
                SELECT id FROM public.companies WHERE created_by = auth.uid()::text
                UNION
                SELECT company_id FROM public.company_members WHERE user_id::text = auth.uid()::text
            )
        )
    )
    WITH CHECK (
        receipt_id IN (
            SELECT id FROM public.receipts WHERE company_id IN (
                SELECT id FROM public.companies WHERE created_by = auth.uid()::text
                UNION
                SELECT company_id FROM public.company_members WHERE user_id::text = auth.uid()::text
            )
        )
    );

-- 9. POLÍTICAS ESTRICTAS PARA ENLACES COMPARTIDOS (SHARE_LINKS)
DROP POLICY IF EXISTS "Gestión de enlaces compartidos por miembros" ON public.share_links;
CREATE POLICY "Gestión de enlaces compartidos por miembros" ON public.share_links
    FOR ALL TO authenticated
    USING (
        receipt_id IN (
            SELECT id FROM public.receipts WHERE company_id IN (
                SELECT id FROM public.companies WHERE created_by = auth.uid()::text
                UNION
                SELECT company_id FROM public.company_members WHERE user_id::text = auth.uid()::text
            )
        )
    )
    WITH CHECK (
        receipt_id IN (
            SELECT id FROM public.receipts WHERE company_id IN (
                SELECT id FROM public.companies WHERE created_by = auth.uid()::text
                UNION
                SELECT company_id FROM public.company_members WHERE user_id::text = auth.uid()::text
            )
        )
    );

-- ==============================================================================
-- 10. FUNCIÓN SEGURA PARA VALIDACIÓN PÚBLICA POR CÓDIGO QR (RPC)
-- NO expone RFC, CURP, NSS, importes, bancos, percepciones, firmas ni datos sensibles
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_receipt_public_validation(p_code TEXT)
RETURNS JSON AS $$
DECLARE
    v_receipt RECORD;
    v_company RECORD;
    v_result JSON;
BEGIN
    -- Buscar recibo por código de verificación sanitizado
    SELECT r.id, r.company_id, r.folio, r.internal_folio, r.receipt_type, r.payment_date, r.status, r.verification_code
    INTO v_receipt
    FROM public.receipts r
    WHERE pg_catalog.upper(pg_catalog.trim(r.verification_code)) = pg_catalog.upper(pg_catalog.trim(p_code))
      AND r.deleted_at IS NULL;

    IF NOT FOUND THEN
        RETURN pg_catalog.json_build_object(
            'is_valid', false,
            'message', 'Código de verificación no encontrado o inválido.'
        );
    END IF;

    -- Obtener únicamente el nombre o razón social de la empresa emisora
    SELECT c.name, c.business_name
    INTO v_company
    FROM public.companies c
    WHERE c.id = v_receipt.company_id;

    -- Construir respuesta pública sanitizada (SIN datos personales ni financieros)
    v_result := pg_catalog.json_build_object(
        'is_valid', true,
        'company_name', pg_catalog.coalesce(v_company.business_name, v_company.name, 'Empresa Emisora'),
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

-- Revocar permisos heredados a PUBLIC y otorgar solo a roles necesarios
REVOKE EXECUTE ON FUNCTION public.get_receipt_public_validation(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_receipt_public_validation(TEXT) TO anon, authenticated;

-- ==============================================================================
-- 11. FUNCIÓN SEGURA PARA CONSULTA DE ENLACES COMPARTIDOS VÁLIDOS (RPC)
-- Minimiza datos: Omite tokens, IDs internos, CURP, NSS y datos no visuales
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
    -- Validar token, vigencia y que no esté revocado
    SELECT expires_at, is_revoked, id, receipt_id INTO v_link
    FROM public.share_links
    WHERE token = p_token
      AND is_revoked = false
      AND expires_at > pg_catalog.now();

    IF NOT FOUND THEN
        RETURN pg_catalog.json_build_object('is_valid', false, 'message', 'Enlace expirado o no válido.');
    END IF;

    -- Incrementar contador de accesos
    UPDATE public.share_links
    SET access_count = access_count + 1
    WHERE id = v_link.id;

    -- Obtener recibo
    SELECT * INTO v_receipt FROM public.receipts WHERE id = v_link.receipt_id AND deleted_at IS NULL;
    IF NOT FOUND THEN
        RETURN pg_catalog.json_build_object('is_valid', false, 'message', 'Recibo no encontrado.');
    END IF;

    -- Obtener datos asociados
    SELECT name, business_name, rfc, address, phone, email, logo_url, slogan, primary_color, secondary_color, accent_color
    INTO v_company 
    FROM public.companies WHERE id = v_receipt.company_id;

    -- Datos de la persona (OMITIENDO CURP, NSS, EMAIL, TELEFONO)
    SELECT full_name, internal_id, department, position, rfc, contract_type, bank_name, bank_account_masked
    INTO v_person 
    FROM public.people WHERE id = v_receipt.person_id;

    -- Percepciones (solo campos visuales)
    SELECT pg_catalog.coalesce(
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

    -- Deducciones (solo campos visuales)
    SELECT pg_catalog.coalesce(
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
-- 12. FUNCIÓN ATÓMICA DE FOLIOS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_next_folio(p_company_id TEXT)
RETURNS TEXT AS $$
DECLARE
    v_prefix TEXT;
    v_num INT;
    v_formatted_folio TEXT;
BEGIN
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
-- 13. POLÍTICAS DE ALMACENAMIENTO (STORAGE) CON AISLAMIENTO MULTIEMPRESA
-- ==============================================================================
-- 13.1. BUCKET PÚBLICO: company-public-assets (public = true)
-- Estructura: {company_id}/logos/{filename} o {company_id}/letterheads/{filename}
-- NOTA DE SEGURIDAD: NO se crea ninguna política SELECT pública.
-- La descarga directa funciona por la propiedad public = true del bucket.
-- La ausencia de política SELECT impide a usuarios anónimos listar el bucket con list().

-- Subida: Exclusivamente miembros autenticados de la empresa
CREATE POLICY "Subida de logos por miembros de empresa" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'company-public-assets'
        AND pg_catalog.split_part(name, '/', 1) IN (
            SELECT company_id::text FROM public.company_members WHERE user_id::text = auth.uid()::text
        )
        AND pg_catalog.split_part(name, '/', 2) IN ('logos', 'letterheads')
    );

-- Modificación: Exclusivamente administradores de la empresa (USING y WITH CHECK)
CREATE POLICY "Modificación de logos por administradores" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'company-public-assets'
        AND pg_catalog.split_part(name, '/', 1) IN (
            SELECT company_id::text FROM public.company_members 
            WHERE user_id::text = auth.uid()::text AND role IN ('owner', 'admin')
        )
        AND pg_catalog.split_part(name, '/', 2) IN ('logos', 'letterheads')
    )
    WITH CHECK (
        bucket_id = 'company-public-assets'
        AND pg_catalog.split_part(name, '/', 1) IN (
            SELECT company_id::text FROM public.company_members 
            WHERE user_id::text = auth.uid()::text AND role IN ('owner', 'admin')
        )
        AND pg_catalog.split_part(name, '/', 2) IN ('logos', 'letterheads')
    );

-- Eliminación: Exclusivamente administradores de la empresa
CREATE POLICY "Eliminación de logos por administradores" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'company-public-assets'
        AND pg_catalog.split_part(name, '/', 1) IN (
            SELECT company_id::text FROM public.company_members 
            WHERE user_id::text = auth.uid()::text AND role IN ('owner', 'admin')
        )
        AND pg_catalog.split_part(name, '/', 2) IN ('logos', 'letterheads')
    );

-- 13.2. BUCKET PRIVADO: receipt-private-assets (public = false)
-- Estructura: {company_id}/{receipt_id}/{filename}
-- Rol anon NO tiene permiso de SELECT.
CREATE POLICY "Lectura privada restringida a miembros de la empresa" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'receipt-private-assets'
        AND pg_catalog.split_part(name, '/', 1) IN (
            SELECT company_id::text FROM public.company_members WHERE user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Subida privada restringida a miembros de la empresa" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'receipt-private-assets'
        AND pg_catalog.split_part(name, '/', 1) IN (
            SELECT company_id::text FROM public.company_members WHERE user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Modificación privada restringida a administradores" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'receipt-private-assets'
        AND pg_catalog.split_part(name, '/', 1) IN (
            SELECT company_id::text FROM public.company_members 
            WHERE user_id::text = auth.uid()::text AND role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        bucket_id = 'receipt-private-assets'
        AND pg_catalog.split_part(name, '/', 1) IN (
            SELECT company_id::text FROM public.company_members 
            WHERE user_id::text = auth.uid()::text AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Eliminación privada restringida a propietarios" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'receipt-private-assets'
        AND pg_catalog.split_part(name, '/', 1) IN (
            SELECT company_id::text FROM public.company_members 
            WHERE user_id::text = auth.uid()::text AND role = 'owner'
        )
    );
