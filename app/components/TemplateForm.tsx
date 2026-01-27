'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { Template, TemplateMetadata, BodyType, StyleTag, Mood, Occasion, Framing, Lighting, ColorPalette, TransitionType, Category } from '@/types/template';
import { User } from 'firebase/auth';
import { compressImage, compressImages, validatePayloadSize } from '@/lib/utils/image-compression';

interface TemplateFormProps {
  template?: Template | null;
  onClose: () => void;
  onSuccess: () => void;
  user: User;
}

export function TemplateForm({ template, onClose, onSuccess, user }: TemplateFormProps) {
  const [loading, setLoading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [compressionStatus, setCompressionStatus] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>(template?.imageUrl || '');
  const [imageData, setImageData] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Variants state
  const [variantPreviews, setVariantPreviews] = useState<string[]>(template?.variants || []);
  const [variantDataList, setVariantDataList] = useState<string[]>([]);
  const variantInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null]);

  // Form state
  const [title, setTitle] = useState(template?.title || '');
  const [description, setDescription] = useState(template?.description || '');
  const [prompt, setPrompt] = useState(template?.prompt || '');
  const [websiteUrl, setWebsiteUrl] = useState(template?.websiteUrl || '');
  const [isActive, setIsActive] = useState(template?.isActive ?? true);
  const [isPremium, setIsPremium] = useState(template?.isPremium ?? false);
  const [transition, setTransition] = useState<TransitionType>(template?.transition || 'fade');

  // Categories state (default to 'trending')
  const [categories, setCategories] = useState<Category[]>(template?.categories || ['trending']);

  // Metadata state
  const [bodyType, setBodyType] = useState<BodyType[]>(template?.metadata.bodyType || []);
  const [style, setStyle] = useState<StyleTag[]>(template?.metadata.style || []);
  const [mood, setMood] = useState<Mood[]>(template?.metadata.mood || []);
  const [occasion, setOccasion] = useState<Occasion[]>(template?.metadata.occasion || []);
  const [framing, setFraming] = useState<Framing>(template?.metadata.framing || 'portrait');
  const [lighting, setLighting] = useState<Lighting>(template?.metadata.lighting || 'natural');
  const [colorPalette, setColorPalette] = useState<ColorPalette[]>(template?.metadata.colorPalette || []);
  const [setting, setSetting] = useState<('indoor' | 'outdoor' | 'studio')[]>(template?.metadata.setting || []);

  // Brands state
  const [brands, setBrands] = useState<Array<{id: string; name: string; domain: string}>>([]);

  // Load brands on mount
  React.useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/brands', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBrands(data.brands || []);
      }
    } catch (error) {
      console.error('Error loading brands:', error);
    }
  };

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

  const handleVariantUpload = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;

      // Actualizar preview
      const newPreviews = [...variantPreviews];
      newPreviews[index] = dataUrl;
      setVariantPreviews(newPreviews);

      // Actualizar data
      const newDataList = [...variantDataList];
      newDataList[index] = dataUrl;
      setVariantDataList(newDataList);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveVariant = (index: number) => {
    const newPreviews = [...variantPreviews];
    newPreviews.splice(index, 1);
    setVariantPreviews(newPreviews);

    const newDataList = [...variantDataList];
    newDataList.splice(index, 1);
    setVariantDataList(newDataList);
  };

  const analyzeWithAI = async () => {
    if (!imageData) {
      alert('Por favor sube una imagen primero');
      return;
    }

    setAiAnalyzing(true);
    try {
      console.log('🤖 Analizando imagen con IA...');
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/analyze-template', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageData }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al analizar imagen');
      }

      const { analysis } = await response.json();
      console.log('✅ Análisis completado:', analysis);

      // Populate form fields with AI analysis
      setTitle(analysis.title || '');
      setDescription(analysis.description || '');
      setPrompt(analysis.prompt || '');
      setBodyType(analysis.bodyType || []);
      setStyle(analysis.style || []);
      setMood(analysis.mood || []);
      setOccasion(analysis.occasion || []);
      setFraming(analysis.framing || 'portrait');
      setLighting(analysis.lighting || 'natural');
      setColorPalette(analysis.colorPalette || []);
      setSetting(analysis.setting || []);

      alert('✅ Análisis completado! Los campos se han llenado automáticamente. Revisa y ajusta si es necesario.');
    } catch (error: any) {
      console.error('❌ Error al analizar imagen:', error);
      alert(error.message || 'Error al analizar imagen con IA');
    } finally {
      setAiAnalyzing(false);
    }
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

    if (categories.length === 0) {
      alert('Por favor selecciona al menos una categoría');
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
        categories,
        metadata,
        isActive,
        isPremium,
        transition,
        websiteUrl: websiteUrl || null, // Include websiteUrl (null if empty for shared templates)
      };

      // Comprimir y agregar imagen principal si es nueva
      if (imageData) {
        setCompressionStatus('Comprimiendo imagen principal...');
        console.log('🔄 Comprimiendo imagen principal...');
        const compressedImage = await compressImage(imageData, 800); // Max 800KB
        body.imageData = compressedImage;
      }

      // Incluir variantes (combinar las existentes que no cambiaron con las nuevas)
      const finalVariants: string[] = [];
      const newVariantsToCompress: string[] = [];

      for (let i = 0; i < 3; i++) {
        if (variantDataList[i]) {
          // Nueva variante que necesita compresión
          newVariantsToCompress.push(variantDataList[i]);
        } else if (variantPreviews[i]) {
          // Variante existente (URL de Firebase) - no comprimir
          finalVariants.push(variantPreviews[i]);
        }
      }

      // Comprimir las nuevas variantes en paralelo
      if (newVariantsToCompress.length > 0) {
        setCompressionStatus(`Comprimiendo ${newVariantsToCompress.length} variantes...`);
        console.log(`🔄 Comprimiendo ${newVariantsToCompress.length} variantes...`);
        const compressedVariants = await compressImages(newVariantsToCompress, 600); // Max 600KB por variante
        finalVariants.push(...compressedVariants);
      }

      setCompressionStatus('Subiendo al servidor...');

      if (finalVariants.length > 0) {
        body.variants = finalVariants;
      }

      // Validar tamaño total del payload
      const validation = validatePayloadSize(body.imageData || null, finalVariants);
      console.log(`📦 Payload size: ${validation.sizeKB.toFixed(0)}KB / ${validation.maxKB}KB`);

      if (!validation.valid) {
        alert(`Error: El tamaño total (${validation.sizeKB.toFixed(0)}KB) excede el límite de ${validation.maxKB}KB. Reduce el número de variantes o la calidad de las imágenes.`);
        setLoading(false);
        return;
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

      setCompressionStatus('');
      onSuccess();
    } catch (error: any) {
      console.error('Error saving template:', error);
      alert(error.message || 'Error al guardar template');
    } finally {
      setLoading(false);
      setCompressionStatus('');
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-2 sm:p-4"
      onClick={(e) => {
        // Only close if clicking directly on the backdrop, not on children
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="relative max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-2xl sm:rounded-3xl border border-pink-500/30 shadow-2xl shadow-pink-500/20 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors touch-manipulation"
        >
          <X size={18} className="sm:w-5 sm:h-5" />
        </button>

        <div className="overflow-y-auto p-4 sm:p-6 md:p-8">
          <form onSubmit={handleSubmit}>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight uppercase italic mb-4 sm:mb-6 pr-8">
            {template ? 'Editar Template' : 'Nuevo Template'}
          </h2>

          <div className="space-y-4 sm:space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block text-xs sm:text-sm font-bold mb-2">Imagen del Template *</label>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                {imagePreview && (
                  <div className="w-full sm:w-32 h-40 rounded-xl overflow-hidden border-2 border-pink-500/30">
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
                    className="w-full h-full min-h-[140px] sm:min-h-[160px] rounded-xl border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 active:bg-white/15 flex flex-col items-center justify-center gap-2 transition-all touch-manipulation"
                  >
                    <Upload size={28} className="text-gray-400 sm:w-8 sm:h-8" />
                    <span className="text-xs sm:text-sm text-gray-400">
                      {imagePreview ? 'Cambiar imagen' : 'Subir imagen'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* AI Analysis Button */}
            {imageData && (
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold mb-1">✨ Análisis con IA</h3>
                    <p className="text-xs text-gray-400">
                      Usa Gemini AI para analizar la imagen y llenar automáticamente todos los campos del formulario
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={analyzeWithAI}
                    disabled={aiAnalyzing || loading}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold hover:from-purple-700 hover:to-pink-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                  >
                    {aiAnalyzing ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Analizando...
                      </>
                    ) : (
                      <>
                        🤖 Analizar
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Variants Section */}
            <div>
              <label className="block text-xs sm:text-sm font-bold mb-2">
                Variantes del Template (Opcional)
                <span className="text-gray-500 font-normal ml-2">Hasta 3 versiones para el carousel</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="relative">
                    <input
                      ref={(el) => { variantInputRefs.current[index] = el; }}
                      type="file"
                      accept="image/*"
                      onChange={handleVariantUpload(index)}
                      className="hidden"
                    />
                    {variantPreviews[index] ? (
                      <div className="relative w-full aspect-[3/4.5] rounded-xl overflow-hidden border-2 border-pink-500/30 group">
                        <img
                          src={variantPreviews[index]}
                          alt={`Variant ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => variantInputRefs.current[index]?.click()}
                            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
                          >
                            <Upload size={14} className="text-white" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(index)}
                            className="w-8 h-8 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center"
                          >
                            <X size={14} className="text-white" />
                          </button>
                        </div>
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-pink-500 text-white text-[10px] font-bold">
                          #{index + 1}
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => variantInputRefs.current[index]?.click()}
                        className="w-full aspect-[3/4.5] rounded-xl border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 active:bg-white/15 flex flex-col items-center justify-center gap-1 transition-all touch-manipulation"
                      >
                        <ImageIcon size={20} className="text-gray-400" />
                        <span className="text-[10px] text-gray-500">
                          Variante {index + 1}
                        </span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 Las variantes se mostrarán en un carousel automático que rota cada 3 segundos
              </p>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs sm:text-sm font-bold mb-2">Título *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-white/5 border border-white/10 focus:border-pink-500/50 focus:outline-none text-sm sm:text-base"
                placeholder="Ej: Midnight Celebration"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs sm:text-sm font-bold mb-2">Descripción *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-white/5 border border-white/10 focus:border-pink-500/50 focus:outline-none resize-none text-sm sm:text-base"
                placeholder="Describe el template..."
              />
            </div>

            {/* Prompt */}
            <div>
              <label className="block text-xs sm:text-sm font-bold mb-2">Prompt de Gemini *</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-white/5 border border-white/10 focus:border-pink-500/50 focus:outline-none resize-none font-mono text-xs sm:text-sm"
                placeholder="Instrucciones para Gemini..."
              />
            </div>

            {/* Website Selector */}
            <div>
              <label className="block text-xs sm:text-sm font-bold mb-2">
                Website (Opcional)
                <span className="text-gray-500 font-normal ml-2">
                  Selecciona para un sitio específico o deja en blanco para compartir
                </span>
              </label>
              <select
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-white/5 border border-white/10 focus:border-pink-500/50 focus:outline-none text-sm sm:text-base"
              >
                <option value="">🌐 Todos los sitios (compartido)</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.domain}>
                    {brand.name} ({brand.domain})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">
                💡 Selecciona un sitio específico para filtrar este template solo para ese dominio. Si seleccionas "Todos los sitios", aparecerá en todas las marcas.
              </p>
            </div>

            {/* Categories Section */}
            <div className="border-t border-white/10 pt-4 sm:pt-6">
              <h3 className="text-lg sm:text-xl font-black mb-3 sm:mb-4">Categorías *</h3>
              <p className="text-xs text-gray-400 mb-3">Selecciona las categorías donde aparecerá este template. Por defecto aparece en "Trending".</p>
              <div className="flex flex-wrap gap-2">
                {(['trending', 'editorial', 'new-year', 'cinematic', 'party', 'birthday', 'casual', 'professional', 'date', 'wedding', 'graduation', 'vacation'] as Category[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleArrayValue(categories, cat, setCategories)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      categories.includes(cat)
                        ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-500/30'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {cat === 'new-year' ? 'New Year' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Metadata Section */}
            <div className="border-t border-white/10 pt-4 sm:pt-6">
              <h3 className="text-lg sm:text-xl font-black mb-3 sm:mb-4">Metadata</h3>

              {/* Body Type */}
              <div className="mb-4">
                <label className="block text-xs sm:text-sm font-bold mb-2">Tipo de Cuerpo *</label>
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

              {/* Transition Type */}
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">Transición (Variantes)</label>
                <select
                  value={transition}
                  onChange={(e) => setTransition(e.target.value as TransitionType)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-pink-500/50 focus:outline-none text-white appearance-none cursor-pointer hover:bg-white/10 transition-colors"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    backgroundSize: '1rem',
                  }}
                >
                  <option value="fade" className="bg-gray-900 text-white">Fade (Desvanecimiento)</option>
                  <option value="slide" className="bg-gray-900 text-white">Slide (Deslizar)</option>
                  <option value="zoom" className="bg-gray-900 text-white">Zoom (Ampliar)</option>
                  <option value="flip" className="bg-gray-900 text-white">Flip (Voltear)</option>
                  <option value="blur" className="bg-gray-900 text-white">Blur (Difuminar)</option>
                  <option value="rotate" className="bg-gray-900 text-white">Rotate (Rotar)</option>
                </select>
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

            {/* Compression Status */}
            {compressionStatus && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex items-center gap-3">
                <Loader2 size={16} className="animate-spin text-blue-400" />
                <span className="text-sm text-blue-300">{compressionStatus}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-2xl font-black text-lg bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-xl shadow-pink-500/30 hover:shadow-pink-500/50 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 uppercase italic"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  {compressionStatus || 'Guardando...'}
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
