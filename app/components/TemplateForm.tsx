'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { Template, TemplateMetadata, BodyType, StyleTag, Mood, Occasion, Framing, Lighting, ColorPalette } from '@/types/template';
import { User } from 'firebase/auth';

interface TemplateFormProps {
  template?: Template | null;
  onClose: () => void;
  onSuccess: () => void;
  user: User;
}

export function TemplateForm({ template, onClose, onSuccess, user }: TemplateFormProps) {
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>(template?.imageUrl || '');
  const [imageData, setImageData] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState(template?.title || '');
  const [description, setDescription] = useState(template?.description || '');
  const [prompt, setPrompt] = useState(template?.prompt || '');
  const [isActive, setIsActive] = useState(template?.isActive ?? true);
  const [isPremium, setIsPremium] = useState(template?.isPremium ?? false);

  // Metadata state
  const [bodyType, setBodyType] = useState<BodyType[]>(template?.metadata.bodyType || []);
  const [style, setStyle] = useState<StyleTag[]>(template?.metadata.style || []);
  const [mood, setMood] = useState<Mood[]>(template?.metadata.mood || []);
  const [occasion, setOccasion] = useState<Occasion[]>(template?.metadata.occasion || []);
  const [framing, setFraming] = useState<Framing>(template?.metadata.framing || 'portrait');
  const [lighting, setLighting] = useState<Lighting>(template?.metadata.lighting || 'natural');
  const [colorPalette, setColorPalette] = useState<ColorPalette[]>(template?.metadata.colorPalette || []);
  const [setting, setSetting] = useState<('indoor' | 'outdoor' | 'studio')[]>(template?.metadata.setting || []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImagePreview(dataUrl);
      setImageData(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!title || !description || !prompt) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    if (!template && !imageData) {
      alert('Por favor sube una imagen');
      return;
    }

    if (bodyType.length === 0 || style.length === 0 || mood.length === 0 || occasion.length === 0) {
      alert('Por favor selecciona al menos una opción en cada categoría de metadata');
      return;
    }

    try {
      setLoading(true);

      const metadata: TemplateMetadata = {
        bodyType,
        style,
        mood,
        occasion,
        framing,
        lighting,
        colorPalette,
        setting,
        popularityScore: template?.metadata.popularityScore || 0,
        qualityScore: template?.metadata.qualityScore || 0,
      };

      const token = await user.getIdToken();

      const body: any = {
        title,
        description,
        prompt,
        metadata,
        isActive,
        isPremium,
      };

      // Solo incluir imageData si hay una nueva imagen
      if (imageData) {
        body.imageData = imageData;
      }

      // Si estamos editando, incluir el templateId
      if (template) {
        body.templateId = template.id;
      }

      const response = await fetch('/api/admin/templates', {
        method: template ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar template');
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving template:', error);
      alert(error.message || 'Error al guardar template');
    } finally {
      setLoading(false);
    }
  };

  const toggleArrayValue = <T,>(arr: T[], value: T, setter: (arr: T[]) => void) => {
    if (arr.includes(value)) {
      setter(arr.filter(v => v !== value));
    } else {
      setter([...arr, value]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="relative max-w-4xl w-full max-h-[90vh] bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-3xl border border-pink-500/30 shadow-2xl shadow-pink-500/20 flex flex-col">
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
          <h2 className="text-3xl font-black tracking-tight uppercase italic mb-6">
            {template ? 'Editar Template' : 'Nuevo Template'}
          </h2>

          <div className="space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-bold mb-2">Imagen del Template *</label>
              <div className="flex gap-4">
                {imagePreview && (
                  <div className="w-32 h-40 rounded-xl overflow-hidden border-2 border-pink-500/30">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-full min-h-[160px] rounded-xl border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center gap-2 transition-all"
                  >
                    <Upload size={32} className="text-gray-400" />
                    <span className="text-sm text-gray-400">
                      {imagePreview ? 'Cambiar imagen' : 'Subir imagen'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-bold mb-2">Título *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-pink-500/50 focus:outline-none"
                placeholder="Ej: Midnight Celebration"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold mb-2">Descripción *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-pink-500/50 focus:outline-none resize-none"
                placeholder="Describe el template..."
              />
            </div>

            {/* Prompt */}
            <div>
              <label className="block text-sm font-bold mb-2">Prompt de Gemini *</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-pink-500/50 focus:outline-none resize-none font-mono text-sm"
                placeholder="Instrucciones para Gemini..."
              />
            </div>

            {/* Metadata Section */}
            <div className="border-t border-white/10 pt-6">
              <h3 className="text-xl font-black mb-4">Metadata</h3>

              {/* Body Type */}
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">Tipo de Cuerpo *</label>
                <div className="flex flex-wrap gap-2">
                  {(['athletic', 'slim', 'curvy', 'plus-size', 'average'] as BodyType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleArrayValue(bodyType, type, setBodyType)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        bodyType.includes(type)
                          ? 'bg-pink-500 text-white'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Style */}
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">Estilo *</label>
                <div className="flex flex-wrap gap-2">
                  {(['elegant', 'casual', 'professional', 'party', 'romantic', 'edgy', 'vintage', 'modern'] as StyleTag[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleArrayValue(style, s, setStyle)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        style.includes(s)
                          ? 'bg-pink-500 text-white'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mood */}
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">Mood *</label>
                <div className="flex flex-wrap gap-2">
                  {(['happy', 'confident', 'relaxed', 'energetic', 'mysterious', 'playful'] as Mood[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleArrayValue(mood, m, setMood)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        mood.includes(m)
                          ? 'bg-pink-500 text-white'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Occasion */}
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">Ocasión *</label>
                <div className="flex flex-wrap gap-2">
                  {(['new-year', 'birthday', 'wedding', 'casual', 'professional', 'date', 'party'] as Occasion[]).map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => toggleArrayValue(occasion, o, setOccasion)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        occasion.includes(o)
                          ? 'bg-pink-500 text-white'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Framing */}
                <div>
                  <label className="block text-sm font-bold mb-2">Encuadre</label>
                  <select
                    value={framing}
                    onChange={(e) => setFraming(e.target.value as Framing)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-pink-500/50 focus:outline-none text-white appearance-none cursor-pointer hover:bg-white/10 transition-colors"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 1rem center',
                      backgroundSize: '1rem',
                    }}
                  >
                    <option value="close-up" className="bg-gray-900 text-white">Close-up</option>
                    <option value="medium" className="bg-gray-900 text-white">Medium</option>
                    <option value="full-body" className="bg-gray-900 text-white">Full Body</option>
                    <option value="portrait" className="bg-gray-900 text-white">Portrait</option>
                  </select>
                </div>

                {/* Lighting */}
                <div>
                  <label className="block text-sm font-bold mb-2">Iluminación</label>
                  <select
                    value={lighting}
                    onChange={(e) => setLighting(e.target.value as Lighting)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-pink-500/50 focus:outline-none text-white appearance-none cursor-pointer hover:bg-white/10 transition-colors"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 1rem center',
                      backgroundSize: '1rem',
                    }}
                  >
                    <option value="natural" className="bg-gray-900 text-white">Natural</option>
                    <option value="studio" className="bg-gray-900 text-white">Studio</option>
                    <option value="dramatic" className="bg-gray-900 text-white">Dramatic</option>
                    <option value="soft" className="bg-gray-900 text-white">Soft</option>
                    <option value="neon" className="bg-gray-900 text-white">Neon</option>
                  </select>
                </div>
              </div>

              {/* Color Palette */}
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">Paleta de Colores</label>
                <div className="flex flex-wrap gap-2">
                  {(['warm', 'cool', 'neutral', 'vibrant', 'pastel'] as ColorPalette[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleArrayValue(colorPalette, c, setColorPalette)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        colorPalette.includes(c)
                          ? 'bg-pink-500 text-white'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Setting */}
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">Ambiente</label>
                <div className="flex flex-wrap gap-2">
                  {(['indoor', 'outdoor', 'studio'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleArrayValue(setting, s, setSetting)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        setting.includes(s)
                          ? 'bg-pink-500 text-white'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div className="flex gap-6 border-t border-white/10 pt-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-5 h-5 rounded border-2 border-white/20 bg-white/5 checked:bg-pink-500 checked:border-pink-500"
                />
                <span className="text-sm font-medium">Template Activo</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPremium}
                  onChange={(e) => setIsPremium(e.target.checked)}
                  className="w-5 h-5 rounded border-2 border-white/20 bg-white/5 checked:bg-yellow-500 checked:border-yellow-500"
                />
                <span className="text-sm font-medium">Premium</span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-2xl font-black text-lg bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-xl shadow-pink-500/30 hover:shadow-pink-500/50 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 uppercase italic"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  {template ? 'Actualizar Template' : 'Crear Template'}
                </>
              )}
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
}
