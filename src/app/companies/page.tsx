'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react';
import { 
  Building2, 
  Palette, 
  Save, 
  PlusCircle, 
  CheckCircle2, 
  Sparkles,
  Image as ImageIcon
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { useApp } from '@/context/app-context';
import { Company, PaperSize } from '@/types/database';
import { ImageUploader } from '@/components/ui/image-uploader';

export default function CompaniesAndTemplatePage() {
  const { 
    companies, 
    activeCompany, 
    setActiveCompanyId, 
    updateCompany, 
    addCompany 
  } = useApp();

  const current = activeCompany || companies[0];

  // Estados del Formulario de la Empresa
  const [name, setName] = useState(current?.name || '');
  const [businessName, setBusinessName] = useState(current?.business_name || '');
  const [slogan, setSlogan] = useState(current?.slogan || '');
  const [rfc, setRfc] = useState(current?.rfc || '');
  const [address, setAddress] = useState(current?.address || '');
  const [phone, setPhone] = useState(current?.phone || '');
  const [whatsapp, setWhatsapp] = useState(current?.whatsapp || '');
  const [email, setEmail] = useState(current?.email || '');
  const [website, setWebsite] = useState(current?.website || '');
  const [logoUrl, setLogoUrl] = useState(current?.logo_url || '');
  
  // Colores de la plantilla
  const [primaryColor, setPrimaryColor] = useState(current?.primary_color || '#0b192c');
  const [secondaryColor, setSecondaryColor] = useState(current?.secondary_color || '#334155');
  const [accentColor, setAccentColor] = useState(current?.accent_color || '#00a8cc');

  // Configuración de folios y firmas
  const [folioPrefix, setFolioPrefix] = useState(current?.folio_prefix || 'SYSS');
  const [signerName, setSignerName] = useState(current?.signer_name || 'Lic. Karla Hernández López');
  const [signerRole, setSignerRole] = useState(current?.signer_role || 'Gerente de Administración');
  const [signerSignatureUrl, setSignerSignatureUrl] = useState(current?.signer_signature_url || '');
  const [paperSize, setPaperSize] = useState<PaperSize>(current?.paper_size || 'letter_landscape');
  const [legalDisclaimer, setLegalDisclaimer] = useState(current?.legal_disclaimer || '');

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Paletas preconfiguradas recomendadas
  const colorPresets = [
    { name: 'Seguridad & Corporativo (Original)', primary: '#0b192c', secondary: '#334155', accent: '#00a8cc' },
    { name: 'Tecnología & Innovación', primary: '#0f172a', secondary: '#1e293b', accent: '#3b82f6' },
    { name: 'Finanzas & Esmeralda', primary: '#064e3b', secondary: '#065f46', accent: '#10b981' },
    { name: 'Industrial & Ámbar', primary: '#18181b', secondary: '#27272a', accent: '#f59e0b' },
    { name: 'Médico & Zafiro', primary: '#1e3a8a', secondary: '#1e40af', accent: '#06b6d4' },
  ];

  const handleSelectCompany = (comp: Company) => {
    setActiveCompanyId(comp.id);
    setName(comp.name);
    setBusinessName(comp.business_name);
    setSlogan(comp.slogan || '');
    setRfc(comp.rfc || '');
    setAddress(comp.address || '');
    setPhone(comp.phone || '');
    setWhatsapp(comp.whatsapp || '');
    setEmail(comp.email || '');
    setWebsite(comp.website || '');
    setLogoUrl(comp.logo_url || '');
    setPrimaryColor(comp.primary_color);
    setSecondaryColor(comp.secondary_color);
    setAccentColor(comp.accent_color);
    setFolioPrefix(comp.folio_prefix);
    setSignerName(comp.signer_name || '');
    setSignerRole(comp.signer_role || '');
    setSignerSignatureUrl(comp.signer_signature_url || '');
    setPaperSize(comp.paper_size);
    setLegalDisclaimer(comp.legal_disclaimer);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!current) return;

    updateCompany(current.id, {
      name,
      business_name: businessName,
      slogan,
      rfc: rfc.toUpperCase(),
      address,
      phone,
      whatsapp,
      email,
      website,
      logo_url: logoUrl || null,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      accent_color: accentColor,
      folio_prefix: folioPrefix.toUpperCase(),
      signer_name: signerName,
      signer_role: signerRole,
      signer_signature_url: signerSignatureUrl || null,
      paper_size: paperSize,
      legal_disclaimer: legalDisclaimer,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleCreateNewCompany = () => {
    const newComp = addCompany({
      name: 'Nueva Organización',
      business_name: 'NUEVA ORGANIZACIÓN S.A. DE C.V.',
      folio_prefix: 'ORG',
      slogan: 'EFICIENCIA Y COMPROMISO',
      primary_color: '#0f172a',
      secondary_color: '#1e293b',
      accent_color: '#3b82f6',
      logo_url: null,
    });
    handleSelectCompany(newComp);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Empresas y Personalización de Plantilla
            </h1>
            <p className="text-xs text-slate-500">
              Configura los colores corporativos, logotipo, datos de contacto y folios para cada empresa.
            </p>
          </div>

          <button
            onClick={handleCreateNewCompany}
            className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4 text-cyan-400" />
            <span>Crear Nueva Empresa</span>
          </button>
        </div>

        {/* Selector de Empresas Registradas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {companies.map((c) => (
            <button
              key={c.id}
              onClick={() => handleSelectCompany(c)}
              className={`p-4 rounded-xl text-left border transition-all flex items-center space-x-3 ${
                c.id === current?.id
                  ? 'bg-white border-cyan-500 shadow-md ring-2 ring-cyan-500/20'
                  : 'bg-white/80 border-slate-200 hover:bg-white'
              }`}
            >
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white shrink-0 font-bold shadow-sm overflow-hidden p-1"
                style={{ backgroundColor: c.primary_color }}
              >
                {c.logo_url ? (
                  <img src={c.logo_url} alt={c.name} className="w-full h-full object-contain" />
                ) : (
                  <Building2 className="w-6 h-6" />
                )}
              </div>
              <div className="overflow-hidden">
                <h4 className="font-bold text-slate-900 text-xs truncate">{c.name}</h4>
                <p className="text-[11px] text-slate-500 font-mono font-semibold">Prefijo: {c.folio_prefix}</p>
              </div>
            </button>
          ))}
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Vista Previa en Vivo del Encabezado con Colores y Logo Actuales */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-cyan-600" />
                <span>Previsualización del Encabezado del Recibo</span>
              </span>
              <span className="text-[11px] text-slate-400">Actualización en tiempo real</span>
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-200 shadow-inner">
              <div className="relative flex flex-col md:flex-row items-stretch justify-between bg-white min-h-[110px]">
                <div 
                  className="receipt-header-polygon flex-1 flex items-center px-6 py-4 md:pr-14"
                  style={{ backgroundColor: primaryColor }}
                >
                  <div className="flex items-center space-x-4">
                    {logoUrl ? (
                      <img 
                        src={logoUrl} 
                        alt="Logo" 
                        className="h-16 w-auto max-h-16 max-w-[80px] object-contain drop-shadow-md shrink-0" 
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center border border-white/20 text-white shrink-0">
                        <Building2 className="w-6 h-6" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="text-white text-base md:text-lg font-black tracking-wider uppercase leading-tight">
                        {businessName || name || 'NOMBRE DE LA EMPRESA'}
                      </h2>
                      {slogan && (
                        <p className="text-xs font-bold tracking-widest uppercase mt-0.5" style={{ color: accentColor }}>
                          {slogan}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-6 py-3 flex flex-col justify-center text-right md:w-[280px] shrink-0 bg-white">
                  <span className="text-sm font-black text-slate-900 uppercase">RECIBO DE NÓMINA</span>
                  <p className="text-[11px] text-slate-500 font-bold font-mono mt-1">FOLIO: {folioPrefix}-2405-0001</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bloques de Configuración */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Columna Izquierda: Identidad Visual, Logotipo y Paleta (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Tarjeta de Logotipo */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                  <ImageIcon className="w-4 h-4 text-cyan-600" />
                  <h3 className="font-black text-slate-900 text-sm">Logotipo de la Empresa</h3>
                </div>

                <ImageUploader
                  label="Imagen del Logotipo"
                  value={logoUrl}
                  onChange={(newUrl) => setLogoUrl(newUrl)}
                  onClear={() => setLogoUrl('')}
                  folder="logos"
                  companyId={current?.id}
                  description="Sube el logo de tu empresa (PNG con fondo transparente recomendado, JPG o SVG)."
                  recommendedSize="Tamaño recomendado: 500x500 px o superior"
                />
              </div>

              {/* Tarjeta de Identidad Cromática */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                  <Palette className="w-4 h-4 text-cyan-600" />
                  <h3 className="font-black text-slate-900 text-sm">Identidad Cromática</h3>
                </div>

                {/* Paletas recomendadas */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Paletas Rápidas</label>
                  <div className="space-y-1.5">
                    {colorPresets.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setPrimaryColor(p.primary);
                          setSecondaryColor(p.secondary);
                          setAccentColor(p.accent);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs transition-colors"
                      >
                        <span className="font-semibold text-slate-700 text-[11px]">{p.name}</span>
                        <div className="flex items-center space-x-1.5">
                          <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: p.primary }} />
                          <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: p.secondary }} />
                          <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: p.accent }} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Color Principal (Encabezado y Pie)</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-10 h-8 rounded border border-slate-300 p-0.5 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Color Secundario (Encabezado Deducciones)</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-10 h-8 rounded border border-slate-300 p-0.5 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Color de Acento (Líneas, Iconos y Eslogan)</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-10 h-8 rounded border border-slate-300 p-0.5 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Datos Generales, Firmas y Contacto (7 cols) */}
            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                <Building2 className="w-4 h-4 text-cyan-600" />
                <h3 className="font-black text-slate-900 text-sm">Información Corporativa, Folios y Firmas</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre Comercial</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Razón Social</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Eslogan</label>
                  <input
                    type="text"
                    value={slogan}
                    onChange={(e) => setSlogan(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium uppercase"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prefijo de Folio</label>
                  <input
                    type="text"
                    value={folioPrefix}
                    onChange={(e) => setFolioPrefix(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold uppercase"
                  />
                </div>
              </div>

              {/* Firma y Firmante */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 uppercase text-[11px]">Representante / Firma Autorizada</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nombre del Firmante</label>
                    <input
                      type="text"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Puesto del Firmante</label>
                    <input
                      type="text"
                      value={signerRole}
                      onChange={(e) => setSignerRole(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                </div>

                <ImageUploader
                  label="Imagen de Firma Digitalizada (Opcional)"
                  value={signerSignatureUrl}
                  onChange={(newUrl) => setSignerSignatureUrl(newUrl)}
                  onClear={() => setSignerSignatureUrl('')}
                  folder="signatures"
                  companyId={current?.id}
                  description="Sube un trazo o firma en PNG con fondo transparente."
                  recommendedSize="Recomendado: 300x120 px"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sitio Web</label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Formato de Papel</label>
                  <select
                    value={paperSize}
                    onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  >
                    <option value="letter_landscape">Carta Horizontal (Letter Landscape)</option>
                    <option value="a4_landscape">A4 Horizontal (A4 Landscape)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Dirección Física</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Aviso Legal en Recibo</label>
                <textarea
                  rows={2}
                  value={legalDisclaimer}
                  onChange={(e) => setLegalDisclaimer(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            {savedSuccess && (
              <span className="text-emerald-600 text-xs font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>¡Configuración y logotipo guardados con éxito!</span>
              </span>
            )}
            <button
              type="submit"
              className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 px-6 rounded-xl shadow-md transition-all"
            >
              <Save className="w-4 h-4 text-cyan-400" />
              <span>Guardar Configuración de Empresa</span>
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
