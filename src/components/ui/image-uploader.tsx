'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Link as LinkIcon, Check, Loader2 } from 'lucide-react';
import { uploadAssetToSupabase } from '@/lib/supabase-service';
import { isSupabaseConfigured } from '@/lib/supabase';

interface ImageUploaderProps {
  label: string;
  value?: string | null;
  onChange: (value: string) => void;
  onClear?: () => void;
  description?: string;
  recommendedSize?: string;
  folder?: 'logos' | 'signatures';
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  value,
  onChange,
  onClear,
  description = 'Sube un archivo PNG, JPG o SVG con fondo transparente.',
  recommendedSize = 'Recomendado: 400x400 px o superior',
  folder = 'logos',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación de tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Tamaño máximo permitido: 5MB');
      return;
    }

    try {
      setIsUploading(true);

      // Si Supabase está configurado, subir al Storage en la nube
      if (isSupabaseConfigured) {
        const publicUrl = await uploadAssetToSupabase(file, folder);
        if (publicUrl) {
          onChange(publicUrl);
          setIsUploading(false);
          return;
        }
      }

      // Fallback a Base64 Local
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onChange(event.target.result as string);
        }
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error procesando imagen:', err);
      setIsUploading(false);
    }
  };

  const handleApplyUrl = () => {
    if (customUrl.trim()) {
      onChange(customUrl.trim());
      setShowUrlInput(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-800">{label}</label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] text-cyan-600 hover:text-cyan-700 font-semibold flex items-center space-x-1"
        >
          <LinkIcon className="w-3 h-3" />
          <span>{showUrlInput ? 'Subir archivo' : 'Usar URL externa'}</span>
        </button>
      </div>

      {showUrlInput ? (
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="https://ejemplo.com/logo.png"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleApplyUrl}
            className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-800 flex items-center space-x-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Aplicar</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center space-x-3">
          {value ? (
            <div className="relative group w-20 h-20 rounded-xl bg-slate-900/90 border border-slate-700 flex items-center justify-center p-2 shrink-0 shadow-sm overflow-hidden">
              <img
                src={value}
                alt="Vista previa"
                className="max-h-full max-w-full object-contain"
              />
              <button
                type="button"
                onClick={() => {
                  if (onClear) onClear();
                  else onChange('');
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-90 hover:opacity-100 transition-opacity shadow"
                title="Eliminar imagen"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="w-20 h-20 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 shrink-0">
              {isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin text-cyan-600" />
              ) : (
                <>
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-[9px] font-semibold mt-1">Sin imagen</span>
                </>
              )}
            </div>
          )}

          <div className="flex-1 space-y-1.5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              onChange={handleFileChange}
              disabled={isUploading}
              className="hidden"
              id={`file-input-${label.replace(/\s+/g, '-').toLowerCase()}`}
            />
            <label
              htmlFor={`file-input-${label.replace(/\s+/g, '-').toLowerCase()}`}
              className={`inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2 px-3 rounded-lg border border-slate-300 cursor-pointer transition-colors shadow-sm ${
                isUploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isUploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-600" />
              ) : (
                <Upload className="w-3.5 h-3.5 text-cyan-600" />
              )}
              <span>{isUploading ? 'Subiendo a la nube...' : (value ? 'Cambiar Imagen' : 'Seleccionar Imagen')}</span>
            </label>
            <p className="text-[10px] text-slate-500 leading-tight">{description}</p>
            <p className="text-[9px] text-slate-400 font-medium">{recommendedSize}</p>
          </div>
        </div>
      )}
    </div>
  );
};
