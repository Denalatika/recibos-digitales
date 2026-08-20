-- ==============================================================================
-- MIGRACIÓN DE REPARACIÓN: CORRECCIÓN DE EXPRESIONES SQL ESPECIALES EN FUNCIONES
-- Archivo: 20260820_fix_postgres_expression_qualification.sql
-- Recrea únicamente las funciones que utilizaban cualificación sobre COALESCE y TRIM
-- ==============================================================================

BEGIN;

-- 1. REPARACIÓN DE TRIGGER: handle_new_user
-- Usa COALESCE como expresión de lenguaje de PostgreSQL (sin prefijo pg_catalog)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Usuario'),
        NEW.email,
        'viewer'
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        updated_at = pg_catalog.now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Asegurar vinculación del trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. REPARACIÓN DE FUNCIÓN RPC: get_receipt_public_validation
-- Usa pg_catalog.btrim para limpieza de cadenas y COALESCE sin prefijo
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

-- 3. REPARACIÓN DE FUNCIÓN RPC: get_shared_receipt
-- Usa COALESCE sin prefijo para los arreglos JSON de percepciones y deducciones
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

COMMIT;
