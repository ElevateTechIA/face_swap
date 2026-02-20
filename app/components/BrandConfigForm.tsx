'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { BrandConfig } from '@/types/brand';
import { User } from 'firebase/auth';
import { compressImage } from '@/lib/utils/image-compression';
import { toast } from 'sonner';

interface BrandConfigFormProps {
  brand?: BrandConfig | null;
  onClose: () => void;
  onSuccess: () => void;
  user: User;
}

export function BrandConfigForm({ brand, onClose, onSuccess, user }: BrandConfigFormProps) {
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>(brand?.logo || '');
  const [logoData, setLogoData] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [domain, setDomain] = useState(brand?.domain || '');
  const [name, setName] = useState(brand?.name || '');
  const [themeId, setThemeId] = useState(brand?.themeId || '');
  const [isActive, setIsActive] = useState(brand?.isActive ?? true);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setLogoPreview(dataUrl);
      setLogoData(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!domain || !name) {
      toast.error('Por favor completa los campos requeridos: Domain y Name');
      return;
    }

    if (!logoData && !brand) {
      toast.error('Por favor sube un logo');
      return;
    }

    setLoading(true);

    try {
      const token = await user.getIdToken();

      const body: any = {
        domain: domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, ''),
        name,
        isActive,
      };

      if (themeId) {
        body.themeId = themeId;
      }

      // Comprimir y agregar logo si es nuevo
      if (logoData) {
        console.log('🔄 Comprimiendo logo...');
        const compressedLogo = await compressImage(logoData, 500); // Max 500KB
        body.logoData = compressedLogo;
      }

      // Si estamos editando, incluir el brandId
      if (brand) {
        body.id = brand.id;
      }

      const response = await fetch('/api/admin/brands', {
        method: brand ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar configuración de marca');
      }

      toast.success(`Configuración de marca ${brand ? 'actualizada' : 'creada'} exitosamente`);
      onSuccess();
    } catch (error: any) {
      console.error('Error saving brand config:', error);
      toast.error(error.message || 'Error al guardar configuración de marca');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="relative max-w-2xl w-full max-h-[90vh] bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-3xl border border-pink-500/30 shadow-2xl shadow-pink-500/20 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="overflow-y-auto p-8">
          <form onSubmit={handleSubmit}>
            <h2 className="text-3xl font-black tracking-tight uppercase italic mb-6 pr-8">
              {brand ? 'Editar Configuración de Marca' : 'Nueva Configuración de Marca'}
            </h2>

            <div className="space-y-6">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-bold mb-2">Logo *</label>
                <div className="flex gap-4">
                  {logoPreview && (
                    <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-pink-500/30 bg-white/5 p-2 flex items-center justify-center">
                      <img src={logoPreview} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-32 rounded-xl border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center gap-2 transition-all"
                    >
                      <Upload size={32} className="text-gray-400" />
                      <span className="text-sm text-gray-400">
                        {logoPreview ? 'Cambiar logo' : 'Subir logo'}
                      </span>
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Recomendado: PNG con fondo transparente, 512x512px
                </p>
              </div>

              {/* Domain */}
              <div>
                <label className="block text-sm font-bold mb-2">Dominio del Website *</label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-pink-500/50 focus:outline-none"
                  placeholder="Ej: glamour-ai.com (sin https://)"
                />
                {brand ? (
                  <p className="text-xs text-yellow-500 mt-2">
                    ⚠️ Cambiar el dominio actualizará todos los templates asociados a esta marca
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Ingresa solo el dominio sin "https://" ni "www" (ej: miapp.com)
                  </p>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-bold mb-2">Nombre de la App *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-pink-500/50 focus:outline-none"
                  placeholder="Ej: GLAMOUR"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Este nombre aparecerá en el header de la aplicación
                </p>
              </div>

              {/* Theme Selection */}
              <div>
                <label className="block text-sm font-bold mb-2">Tema (Opcional)</label>
                <select
                  value={themeId}
                  onChange={(e) => setThemeId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-pink-500/50 focus:outline-none"
                >
                  <option value="">Usar tema por defecto</option>
                  <option value="glamour">Glamour (Pink & Purple)</option>
                  <option value="ocean">Ocean (Blue & Cyan)</option>
                  <option value="pink-boxer">Pink Boxer (Full Pink)</option>
                </select>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-5 h-5 rounded border-white/10 bg-white/5 checked:bg-pink-500"
                />
                <label htmlFor="isActive" className="text-sm font-bold">
                  Configuración Activa
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-6 py-4 rounded-2xl font-bold border border-white/10 text-gray-400 hover:text-white transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !domain || !name}
                className="flex-1 px-6 py-4 rounded-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-xl shadow-pink-500/20 hover:shadow-pink-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Guardando...
                  </>
                ) : (
                  brand ? 'Actualizar' : 'Crear Configuración'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
