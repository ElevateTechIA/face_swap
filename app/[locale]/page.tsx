'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth/AuthProvider';
import { InsufficientCreditsModal } from '@/app/components/InsufficientCreditsModal';
import { LoginGateModal } from '@/app/components/LoginGateModal';
// import { DynamicScreenerSurvey } from '@/app/components/DynamicScreenerSurvey'; // TEMPORALMENTE DESHABILITADO
import { ShareButton } from '@/app/components/ShareButton';
import { ShareModal } from '@/app/components/modals/ShareModal';
import { MobileMenu } from '@/app/components/MobileMenu';
import { PublicGalleryToggle } from '@/app/components/PublicGalleryToggle';
import { AppHeader } from '@/app/components/AppHeader';
// StyleSelector removed - using default style only
import { MultiFaceUpload } from '@/app/components/MultiFaceUpload';
import { TemplateCarousel } from '@/app/components/TemplateCarousel';
import { AI_STYLES } from '@/lib/styles/style-configs';
import { processGroupSwap, type GroupSwapProgress } from '@/lib/group-photos/processor';
import { canUseGuestTrial, markGuestTrialAsUsed, getGuestTrialStatus } from '@/lib/guest-trial';
import {
  Upload, Sparkles, Camera, Download, RefreshCw, ChevronRight, X,
  Grid, Flame, Layers, Play, Zap
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useBrand } from '@/app/contexts/BrandContext';
import { toast } from 'sonner';

// Hero Slideshow Component
const HeroSlideshow: React.FC<{ templates: any[]; onTemplateClick?: (template: any) => void }> = ({ templates, onTemplateClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleImages, setVisibleImages] = useState<number[]>([]);

  // Select random templates for the slideshow - show 3 at a time
  const randomTemplates = React.useMemo(() => {
    if (templates.length === 0) return [];
    const shuffled = [...templates].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(9, templates.length)); // Get 9 to show 3 sets of 3
  }, [templates]);

  useEffect(() => {
    if (randomTemplates.length === 0) return;

    // Animate images appearing one by one
    setVisibleImages([]);
    const timeouts = [
      setTimeout(() => setVisibleImages([0]), 100),
      setTimeout(() => setVisibleImages([0, 1]), 300),
      setTimeout(() => setVisibleImages([0, 1, 2]), 500),
    ];

    const interval = setInterval(() => {
      setVisibleImages([]);
      setCurrentIndex((prev) => (prev + 3) % randomTemplates.length);

      // Stagger the appearance of new images
      setTimeout(() => setVisibleImages([0]), 100);
      setTimeout(() => setVisibleImages([0, 1]), 300);
      setTimeout(() => setVisibleImages([0, 1, 2]), 500);
    }, 4000);

    return () => {
      timeouts.forEach(t => clearTimeout(t));
      clearInterval(interval);
    };
  }, [randomTemplates.length]);

  if (randomTemplates.length === 0) return null;

  // Get 3 templates to display
  const displayTemplates = [
    randomTemplates[currentIndex % randomTemplates.length],
    randomTemplates[(currentIndex + 1) % randomTemplates.length],
    randomTemplates[(currentIndex + 2) % randomTemplates.length],
  ];

  return (
    <div className="relative w-full h-full flex gap-2">
      {displayTemplates.map((template, index) => (
        <div
          key={`${currentIndex}-${index}`}
          onClick={() => onTemplateClick?.(template)}
          className={`flex-1 transition-all duration-500 transform cursor-pointer hover:scale-105 active:scale-95 ${
            visibleImages.includes(index)
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-95'
          }`}
        >
          <img
            src={template.url}
            alt={template.title}
            className="w-full h-full object-cover rounded-xl"
          />
        </div>
      ))}
    </div>
  );
};


// --- Plantillas Fallback (se usan si no hay templates dinámicos de Firebase) ---
const TEMPLATES = [
  { id: 't1', url: '/templates/Midnight Celebration.jpg', title: 'Midnight Celebration', category: 'cinematic', categories: ['trending', 'cinematic'], usageCount: 0 },
  { id: 't2', url: '/templates/The Champagne Toast.jpg', title: 'The Champagne Toast', category: 'editorial', categories: ['trending', 'editorial'], usageCount: 0 },
  { id: 't3', url: '/templates/Red Velvet Euphoria.jpg', title: 'Red Velvet Euphoria', category: 'editorial', categories: ['trending', 'editorial'], usageCount: 0 },
  { id: 't4', url: '/templates/City Lights Glam.jpg', title: 'City Lights Glam', category: 'editorial', categories: ['editorial'], usageCount: 0 },
  { id: 't5', url: '/templates/Confetti Party.jpg', title: 'Confetti Party', category: 'cinematic', categories: ['cinematic', 'party'], usageCount: 0 },
  { id: 't6', url: '/templates/Elegant Countdown.jpg', title: 'Elegant Countdown', category: 'editorial', categories: ['editorial', 'new-year'], usageCount: 0 },
];

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'survey' | 'ai';
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, onClick, variant = 'primary', className = '', disabled = false, isLoading = false }) => {
  const baseStyle = "px-6 py-4 rounded-2xl font-bold transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 w-full";
  const variants = {
    primary: "bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-xl shadow-pink-500/20",
    secondary: "bg-white/5 backdrop-blur-md text-gray-200 border border-white/10 hover:bg-white/10",
    outline: "border-2 border-pink-500 text-pink-500",
    ghost: "text-gray-400 hover:text-white",
    survey: "bg-gray-900/80 border border-white/10 text-left justify-start h-20 px-5",
    ai: "bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30"
  };

  return (
    <button onClick={onClick} disabled={disabled || isLoading} className={`${baseStyle} ${variants[variant]} ${className} ${disabled || isLoading ? 'opacity-50' : ''}`}>
      {isLoading ? <RefreshCw className="animate-spin" size={20} /> : children}
    </button>
  );
};

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const { user, loading: authLoading, signInWithGoogle, signOutUser, getUserIdToken } = useAuth();
  const t = useTranslations();
  const { brand } = useBrand();
  const [step, setStep] = useState(-1); // -1 = login, 0 = encuesta, 1 = templates, 1.5 = variant selection, 2+ = app
  const [sourceImg, setSourceImg] = useState<string | null>(null);
  const [targetImg, setTargetImg] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number>(0);
  // Fixed style - no user selection needed
  const selectedStyle = AI_STYLES[0]; // Always use first style (Artistic)
  const [processingProgress, setProcessingProgress] = useState(0);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [currentFaceSwapId, setCurrentFaceSwapId] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  const [aiCaption, setAiCaption] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [isSigningIn, setIsSigningIn] = useState(false);

  // Estados de créditos
  const [userCredits, setUserCredits] = useState(0);
  const [loadingCredits, setLoadingCredits] = useState(true);
  const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] = useState(false);

  // Estados de Guest Mode
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [showLoginGate, setShowLoginGate] = useState(false);
  const [guestTrialAvailable, setGuestTrialAvailable] = useState(false);

  // Estados de UI
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Estados de Screener Survey (durante generación)
  const [showScreenerSurvey, setShowScreenerSurvey] = useState(false);
  const [hasUserProfile, setHasUserProfile] = useState(false);
  const [isProcessingFaceSwap, setIsProcessingFaceSwap] = useState(false);

  // Estados de templates dinámicos desde Firebase
  const [dynamicTemplates, setDynamicTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // Estado para mensajes durante el procesamiento
  const [processingMessage, setProcessingMessage] = useState('');

  // Mensajes coquetos que cambian durante el procesamiento
  const flirtMessages = [
    "✨ Working our magic on your photo...",
    "💫 You're going to look amazing!",
    "🎨 Adding some sparkle to your beauty...",
    "🌟 Creating something special just for you...",
    "💖 Almost there, gorgeous!",
    "✨ Making you shine even brighter...",
    "🔥 This is going to be fire!",
    "💎 Polishing your masterpiece...",
    "🎭 Transforming you into a star...",
    "⚡ Adding that extra glow...",
    "🌈 Bringing your vision to life...",
    "💝 Can't wait to show you the result!",
    "🎪 The magic is happening...",
    "🎬 Lights, camera, transformation!",
    "👑 Preparing your royal look..."
  ];

  // Group photos state
  const [groupImages, setGroupImages] = useState<string[]>([]);
  const [isGroupPhoto, setIsGroupPhoto] = useState(false);
  const [groupSwapProgress, setGroupSwapProgress] = useState<GroupSwapProgress | null>(null);

  // Cargar templates dinámicos desde Firebase
  useEffect(() => {
    loadTemplates();
  }, [user, brand.name]); // Reload when user or brand changes

  // Cambiar mensajes durante el procesamiento con timer real (~25 segundos)
  useEffect(() => {
    if (step === 4) {
      // Iniciar con el primer mensaje
      setProcessingMessage(flirtMessages[0]);
      
      // Calcular intervalo: ~25 segundos / 15 mensajes = ~1.67 segundos por mensaje
      const messageInterval = 1700; // 1.7 segundos por mensaje
      let currentIndex = 0;

      const interval = setInterval(() => {
        currentIndex++;
        if (currentIndex < flirtMessages.length) {
          setProcessingMessage(flirtMessages[currentIndex]);
        } else {
          // Cuando llegamos al final, volver a empezar si todavía estamos procesando
          currentIndex = 0;
          setProcessingMessage(flirtMessages[0]);
        }
      }, messageInterval);

      return () => clearInterval(interval);
    }
  }, [step]);

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true);

      // Cargar todos los templates (se agruparán en carruseles por categoría)
      const mode = user ? 'recommended' : 'all';

      // Construir URL con parámetros
      const params = new URLSearchParams();
      params.set('mode', mode);

      // Filter templates by brand
      if (brand.name) {
        params.set('brandName', brand.name);
      }

      const headers: Record<string, string> = {};
      if (user && mode === 'recommended') {
        const token = await getUserIdToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await fetch(`/api/templates?${params.toString()}`, { headers });

      if (response.ok) {
        const data = await response.json();
        setDynamicTemplates(data.templates || []);
        console.log(`✅ Loaded ${data.templates?.length || 0} templates (mode: ${mode})`);
      } else {
        console.error('Error loading templates:', response.status);
        setDynamicTemplates([]); // Fallback a array vacío
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setDynamicTemplates([]); // Fallback a array vacío
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Cargar preferencias y créditos al autenticarse
  useEffect(() => {
    if (authLoading) return;
    if (user) {
      loadUserCredits();
      checkUserProfile();
      setIsGuestMode(false);
      setStep(1); // Ir directamente a la app
    } else {

      // Modo guest - ir directo a templates (encuesta desactivada temporalmente)
      setIsGuestMode(true);
      setGuestTrialAvailable(canUseGuestTrial());
      setStep(1); // Ir directamente a templates
      setLoadingCredits(false);
    }
  }, [user, authLoading]);


  const loadUserCredits = async () => {
    try {
      const token = await getUserIdToken();
      if (!token) return;

      const response = await fetch('/api/credits/balance', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUserCredits(data.credits || 0);
      }
    } catch (error) {
      console.error('Error cargando créditos:', error);
    } finally {
      setLoadingCredits(false);
    }
  };

  const checkUserProfile = async () => {
    try {
      const token = await getUserIdToken();
      if (!token) return;

      const response = await fetch('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setHasUserProfile(!!data.profile);
      }
    } catch (error) {
      console.error('Error verificando perfil:', error);
      setHasUserProfile(false);
    }
  };

  const handleScreenerComplete = () => {
    console.log('📋 Screener survey completado');
    setShowScreenerSurvey(false);
    // El componente DynamicScreenerSurvey ya guarda las respuestas internamente
  };

  // Función mejorada para descargar imágenes en móviles
  const handleDownloadImage = async () => {
    if (!resultImage) return;

    try {
      // Generar nombre de archivo con el título del template y fecha
      const templateSlug = (selectedTemplate?.title || 'faceswap')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const now = new Date();
      const dateStr = `${now.toISOString().slice(0, 10)}-${now.toTimeString().slice(0, 8).replace(/:/g, '')}`; // YYYY-MM-DD-HHmmss
      const fileName = `${templateSlug}-${dateStr}.jpg`;

      // Detectar si estamos en un dispositivo móvil
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile && navigator.share) {
        // Usar Web Share API en móviles que lo soporten
        try {
          // Convertir base64 a blob
          const response = await fetch(resultImage);
          const blob = await response.blob();
          const file = new File([blob], fileName, { type: 'image/jpeg' });

          await navigator.share({
            files: [file],
            title: selectedTemplate?.title || 'Face Swap',
            text: 'Check out my amazing face swap!'
          });
          return;
        } catch (shareError) {
          console.log('Share API not available, falling back to download');
        }
      }

      // Fallback: descargar directamente
      const link = document.createElement('a');
      link.href = resultImage;
      link.download = fileName;
      
      // En iOS, abrir en nueva pestaña si el download no funciona
      if (isMobile && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('Error al descargar la imagen. Por favor, intenta de nuevo.');
    }
  };

  const generateCaption = async () => {
    if (!resultImage) return;
    setIsAiLoading(true);
    try {
      const token = await getUserIdToken();
      const response = await fetch('/api/ai/generate-caption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          image: resultImage,
          style: selectedStyle.name,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiCaption(data.caption);
      } else {
        setAiCaption("Viviendo mi mejor versión ✨📸 #GlamAI #NewMe");
      }
    } catch (e) {
      setAiCaption("Viviendo mi mejor versión ✨📸 #GlamAI #NewMe");
    } finally {
      setIsAiLoading(false);
    }
  };

  const urlToBase64 = async (url: string): Promise<string> => {
    try {
      console.log('🔄 Fetching image from URL:', url);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      console.log('✅ Image fetched, size:', blob.size, 'bytes, type:', blob.type);

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          if (!result || !result.includes(',')) {
            reject(new Error('FileReader produced invalid data URL'));
            return;
          }
          console.log('✅ Image converted to base64, format:', result.substring(0, 30) + '...');
          resolve(result);
        };
        reader.onerror = () => reject(new Error('FileReader failed: ' + reader.error?.message));
        reader.readAsDataURL(blob);
      });
    } catch (error: any) {
      console.error('❌ urlToBase64 failed:', error.message);
      throw error;
    }
  };

  const selectTemplate = async (template: any) => {
    setProcessingProgress(10);
    setSelectedTemplate(template);

    // Debug: log template slot data
    console.log('🔍 Template selected:', template.title);
    console.log('🔍 Template slots:', JSON.stringify(template.slots));
    console.log('🔍 Template isGroup:', template.isGroup, 'faceCount:', template.faceCount);

    // Check if this is a multi-slot / group photo template
    const isGroup = (template.slots && template.slots.length > 1) ||
                    template.isGroup ||
                    (template.faceCount && template.faceCount > 1);
    setIsGroupPhoto(isGroup || false);

    console.log('🔍 isGroup resolved to:', isGroup);

    if (isGroup) {
      console.log(`👥 Group template selected: ${template.faceCount || template.slots?.length || 2} faces required`);
    }

    // Verificar si el template tiene variantes (más de 1)
    const variants = getTemplateVariants(template);
    if (variants.length > 1) {
      console.log(`🎨 Template has ${variants.length} variants - showing selection screen`);
      setSelectedVariantIndex(0); // Reset selección
      setStep(1.5); // Ir a pantalla de selección de variante
      setProcessingProgress(0);
      return;
    }

    // Si no tiene variantes o solo tiene 1, continuar con el flujo normal
    const imageUrl = template.url;

    // Si es una URL de Firebase Storage (https://), enviarla directamente al servidor
    // El servidor se encargará de convertirla a base64 sin problemas de CORS
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      console.log('🌐 Template is a URL, will be processed on server:', imageUrl);
      setTargetImg(imageUrl); // Guardar la URL directamente
      setStep(3);
      setProcessingProgress(0);
      return;
    }

    // Si es una ruta local (/templates/...), convertir a base64 en el navegador
    try {
      const base64 = await urlToBase64(imageUrl);
      console.log('✅ Template converted to base64:', base64.substring(0, 50) + '...');
      setTargetImg(base64);
      setStep(3);
    } catch (e) {
      console.error('❌ Error converting template to base64:', e);
      toast.error('Error al cargar la imagen del template. Por favor, intenta de nuevo.');
      setProcessingProgress(0);
      return; // No avanzar si falló la conversión
    }
    setProcessingProgress(0);
  };

  const selectVariant = async (variantUrl: string, index: number) => {
    setProcessingProgress(10);
    setSelectedVariantIndex(index);

    // Si es una URL de Firebase Storage (https://), enviarla directamente
    if (variantUrl.startsWith('http://') || variantUrl.startsWith('https://')) {
      console.log(`✅ Variant ${index + 1} selected:`, variantUrl);
      setTargetImg(variantUrl);
      setStep(3);
      setProcessingProgress(0);
      return;
    }

    // Si es una ruta local, convertir a base64
    try {
      const base64 = await urlToBase64(variantUrl);
      console.log(`✅ Variant ${index + 1} converted to base64`);
      setTargetImg(base64);
      setStep(3);
    } catch (e) {
      console.error('❌ Error converting variant to base64:', e);
      toast.error('Error al cargar la variante. Por favor, intenta de nuevo.');
      setProcessingProgress(0);
      return;
    }
    setProcessingProgress(0);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'source' | 'target') => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        toast.warning('Por favor, selecciona un archivo de imagen válido.');
        return;
      }

      console.log(`📤 Uploading ${type} image:`, file.name, file.type, file.size, 'bytes');

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;

        // Validar que el resultado sea un data URL válido
        if (!result || !result.includes(',')) {
          console.error('❌ FileReader produced invalid result');
          toast.error('Error al cargar la imagen. Por favor, intenta con otra imagen.');
          return;
        }

        console.log(`✅ ${type} image loaded:`, result.substring(0, 50) + '...');

        if (type === 'source') {
          setSourceImg(result);
        } else {
          setTargetImg(result);
          setStep(2);
        }
      };

      reader.onerror = () => {
        console.error('❌ FileReader error:', reader.error);
        toast.error('Error al leer la imagen. Por favor, intenta de nuevo.');
      };

      reader.readAsDataURL(file);
    }
  };

  const processFaceSwapOnServer = async (isGuest = false) => {
    setIsProcessingFaceSwap(true);
    setProcessingProgress(10);

    // Mostrar screener survey si el usuario no tiene perfil y no es guest
    if (!isGuest && !hasUserProfile) {
      setShowScreenerSurvey(true);
    }

    // Validar que las imágenes estén presentes
    if (!sourceImg || !targetImg) {
      toast.error('Error: Imágenes no cargadas correctamente');
      setIsProcessingFaceSwap(false);
      setProcessingProgress(0);
      return;
    }

    // Validar formato: debe ser base64 (data:...) o URL (http...)
    const isSourceValid = sourceImg.includes(',') || sourceImg.startsWith('http://') || sourceImg.startsWith('https://');
    const isTargetValid = targetImg.includes(',') || targetImg.startsWith('http://') || targetImg.startsWith('https://');

    if (!isSourceValid || !isTargetValid) {
      console.error('❌ Invalid image format detected');
      console.error('sourceImg starts with:', sourceImg.substring(0, 50));
      console.error('targetImg starts with:', targetImg.substring(0, 50));
      toast.error('Error: Formato de imagen inválido. Por favor, intenta subir las imágenes de nuevo.');
      setIsProcessingFaceSwap(false);
      setProcessingProgress(0);
      setShowScreenerSurvey(false);
      return;
    }

    console.log('✅ Image validation passed');
    console.log('Source type:', sourceImg.startsWith('http') ? 'URL' : 'Base64');
    console.log('Target type:', targetImg.startsWith('http') ? 'URL' : 'Base64');

    // Simular progreso mientras se procesa
    const progressInterval = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 5;
      });
    }, 500);

    try {
      console.log('🚀 Iniciando Face Swap...');
      console.log('Modo:', isGuest ? 'GUEST TRIAL' : 'AUTHENTICATED');
      console.log('Template seleccionado:', selectedTemplate?.title || 'Ninguno (imagen personalizada)');
      console.log('Style:', selectedStyle.id);
      console.log('📸 Source image format:', sourceImg.substring(0, 50) + '...');
      console.log('📸 Target image format:', targetImg.substring(0, 50) + '...');

      // Preparar headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Si no es guest, agregar auth token
      if (!isGuest) {
        const token = await getUserIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        // Para guest, agregar header especial
        headers['X-Guest-Trial'] = 'true';
      }

      const response = await fetch('/api/face-swap/process', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          sourceImage: sourceImg,
          targetImage: targetImg,
          style: selectedStyle.id,
          templateTitle: selectedTemplate?.title,
          isGuestTrial: isGuest,
        }),
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        let error: any = {};
        try {
          error = await response.json();
        } catch (parseErr) {
          console.error('❌ Could not parse error response');
        }
        console.error('❌ Error response:', error);
        console.error('❌ Error details:', error.details || 'none');
        console.error('❌ Status:', response.status);
        if (error.code === 'INSUFFICIENT_CREDITS') {
          setShowInsufficientCreditsModal(true);
          setStep(3);
          return;
        }
        throw new Error(error.error || 'Error procesando Face Swap');
      }

      const data = await response.json();
      console.log('✅ Success response received');
      console.log('Result image length:', data.resultImage?.substring(0, 50) + '...');

      if (data.success) {
        clearInterval(progressInterval);
        setProcessingProgress(100);
        setResultImage(data.resultImage);
        setCurrentFaceSwapId(data.faceSwapId || null);

        // Si es guest, marcar trial como usado
        if (isGuest) {
          markGuestTrialAsUsed();
          setGuestTrialAvailable(false);
          console.log('✅ Guest trial marcado como usado');
        } else {
          setUserCredits(data.creditsRemaining);
        }

        // Esperar un poco para que el usuario vea el progreso completo
        setTimeout(() => {
          setShowScreenerSurvey(false);
          setIsProcessingFaceSwap(false);
          setStep(5); // Show result screen
          console.log('✅ Face Swap completado - mostrando resultado');
        }, 1000);
      } else {
        throw new Error('Error en el procesamiento');
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      console.error('❌ Error en Face Swap:', error);
      toast.error('Error procesando imagen. Por favor, intenta de nuevo.');
      setShowScreenerSurvey(false);
      setIsProcessingFaceSwap(false);
      setProcessingProgress(0);
      setStep(3);
    }
  };

  const processGroupFaceSwap = async (isGuest = false) => {
    setIsProcessingFaceSwap(true);
    setProcessingProgress(0);
    setStep(4); // Show loader immediately

    try {
      console.log('👥 Starting group face swap with', groupImages.length, 'faces');

      // Build auth headers for the face swap API
      const authHeaders: Record<string, string> = {};
      if (isGuest) {
        authHeaders['X-Guest-Trial'] = 'true';
      } else {
        const token = await getUserIdToken();
        if (token) authHeaders['Authorization'] = `Bearer ${token}`;
      }

      const result = await processGroupSwap({
        templateUrl: targetImg!,
        userImages: groupImages,
        style: selectedStyle.id,
        slots: selectedTemplate?.slots,
        templateTitle: selectedTemplate?.title,
        authHeaders,
        onProgress: (progress) => {
          console.log('Group swap progress:', progress);
          setGroupSwapProgress(progress);

          // Update processing progress percentage
          const percentage = Math.round((progress.currentFace / progress.totalFaces) * 100);
          setProcessingProgress(percentage);
        }
      });

      console.log('✅ Group face swap completed!');
      setResultImage(result);
      setProcessingProgress(100);
      setStep(5);

      // Mark guest trial as used if applicable
      if (isGuest) {
        markGuestTrialAsUsed();
        setGuestTrialAvailable(false);
      }

      // Update credits if authenticated
      if (!isGuest) {
        const newCredits = userCredits - (groupImages.length * parseInt(process.env.NEXT_PUBLIC_CREDITS_PER_FACE_SWAP || '1'));
        setUserCredits(Math.max(0, newCredits));
      }

    } catch (error: any) {
      console.error('❌ Group face swap error:', error);
      toast.error('Error procesando foto grupal: ' + error.message);
      setStep(3);
    } finally {
      setIsProcessingFaceSwap(false);
      setGroupSwapProgress(null);
    }
  };

  const startProcessing = async () => {
    // Check if this is a group photo
    if (isGroupPhoto && groupImages.length > 0) {
      // Si es guest mode
      if (isGuestMode) {
        if (guestTrialAvailable) {
          await processGroupFaceSwap(true); // Guest trial
        } else {
          // Ya usó su trial - mostrar modal de login
          setShowLoginGate(true);
        }
        return;
      }

      // Usuario autenticado - validar créditos antes de iniciar
      const creditsNeeded = groupImages.length * parseInt(process.env.NEXT_PUBLIC_CREDITS_PER_FACE_SWAP || '1');
      if (userCredits < creditsNeeded) {
        setShowInsufficientCreditsModal(true);
        return;
      }

      await processGroupFaceSwap(false); // Authenticated
      return;
    }

    // Regular single face swap
    // Si es guest mode
    if (isGuestMode) {
      if (guestTrialAvailable) {
        setStep(4); // Show loader immediately
        await processFaceSwapOnServer(true); // Guest trial
      } else {
        // Ya usó su trial - mostrar modal de login
        setShowLoginGate(true);
      }
      return;
    }

    // Usuario autenticado - validar créditos antes de iniciar
    if (userCredits < 1) {
      setShowInsufficientCreditsModal(true);
      return;
    }

    setStep(4); // Show loader immediately
    await processFaceSwapOnServer(false); // Authenticated
  };

  // Usar templates dinámicos si están disponibles, sino usar fallback hardcodeado
  const templatesSource = dynamicTemplates.length > 0 ? dynamicTemplates.map(t => ({
    id: t.id,
    url: t.imageUrl,
    title: t.title,
    category: t.categories?.[0] || t.metadata?.occasion?.[0] || 'all', // Use first category, fallback to occasion for backwards compatibility
    categories: t.categories || [t.metadata?.occasion?.[0] || 'all'], // Support multiple categories
    usageCount: t.usageCount || 0,
    faceCount: t.faceCount || 1,
    isGroup: t.isGroup || false,
    variants: t.variants || [],
    slots: t.slots || [],
  })) : TEMPLATES;

  // Función helper para generar variantes de un template
  const getTemplateVariants = (template: any): string[] => {
    // Si el template tiene variantes definidas en Firebase, incluir la imagen principal primero
    if (template.variants && template.variants.length > 0) {
      // IMPORTANTE: Incluir la imagen principal como primera opción, luego las variantes
      return [template.url, ...template.variants];
    }

    // Single image - no variants
    return [template.url];
  };

  // Agrupar templates por categoría para carruseles (dinámico)
  // Extraer todas las categorías únicas de todos los templates (incluyendo múltiples categorías por template)
  const allCategories = templatesSource.flatMap(t => t.categories || [t.category]).filter(Boolean);
  const uniqueCategories = Array.from(new Set(allCategories)).filter(cat => cat !== 'trending'); // Trending se maneja por separado

  // Mapeo de categorías a íconos y colores
  const categoryConfig: Record<string, { icon: any; color: string }> = {
    trending: { icon: Flame, color: 'text-pink-500' },
    editorial: { icon: Layers, color: 'text-purple-500' },
    'new-year': { icon: Sparkles, color: 'text-yellow-500' },
    cinematic: { icon: Play, color: 'text-blue-500' },
    party: { icon: Zap, color: 'text-green-500' },
    birthday: { icon: Sparkles, color: 'text-yellow-400' },
    casual: { icon: Camera, color: 'text-gray-400' },
    professional: { icon: Grid, color: 'text-blue-400' },
    date: { icon: Sparkles, color: 'text-pink-400' },
    wedding: { icon: Sparkles, color: 'text-purple-400' },
    graduation: { icon: Sparkles, color: 'text-blue-300' },
    vacation: { icon: Camera, color: 'text-green-400' },
    default: { icon: Grid, color: 'text-gray-400' }
  };

  // Crear objeto dinámico con todas las categorías
  const templatesByCategory: Record<string, any[]> = {};

  // Para trending, mostrar templates que tengan 'trending' en sus categorías, pero excluir new-year
  const trendingTemplates = templatesSource.filter(t =>
    (t.categories?.includes('trending') || false) && !t.categories?.includes('new-year')
  );

  if (trendingTemplates.length > 0) {
    templatesByCategory.trending = trendingTemplates;
  }

  // Agregar carruseles para cada categoría única encontrada
  uniqueCategories.forEach(category => {
    const categoryTemplates = templatesSource.filter(t =>
      t.categories?.includes(category) || t.category === category
    );
    if (categoryTemplates.length > 0) {
      templatesByCategory[category] = categoryTemplates;
    }
  });

  templatesByCategory.all = templatesSource;

  // Ordenar categorías por cantidad de templates (de mayor a menor)
  const sortedCategories = uniqueCategories.sort((a, b) => {
    const countA = templatesByCategory[a]?.length || 0;
    const countB = templatesByCategory[b]?.length || 0;
    return countB - countA;
  });

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <RefreshCw className="w-12 h-12 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden">
      {step > 0 && (
        <AppHeader
          isGuestMode={isGuestMode}
          userCredits={userCredits}
          loadingCredits={loadingCredits}
          isSigningIn={isSigningIn}
          onSignIn={async () => {
            setIsSigningIn(true);
            try {
              await signInWithGoogle();
            } catch (error) {
              console.error('Error al iniciar sesión:', error);
            } finally {
              setIsSigningIn(false);
            }
          }}
          onMenuClick={() => setShowMobileMenu(true)}
          onLogoClick={() => setStep(1)}
        />
      )}

      {/* Modal de créditos insuficientes */}
      <InsufficientCreditsModal
        isOpen={showInsufficientCreditsModal}
        onClose={() => setShowInsufficientCreditsModal(false)}
        onBuyCredits={() => {
          setShowInsufficientCreditsModal(false);
          router.push('/credits');
        }}
      />

      {/* Modal de Login Gate para Guests */}
      <LoginGateModal
        isOpen={showLoginGate}
        onClose={() => setShowLoginGate(false)}
        onLogin={async () => {
          await signInWithGoogle();
          setShowLoginGate(false);
        }}
        resultImage={resultImage || undefined}
      />

      {/* Screener Survey durante generación - Dinámico */}
      {/* TEMPORALMENTE DESHABILITADO */}
      {/* {showScreenerSurvey && (
        <DynamicScreenerSurvey
          onComplete={handleScreenerComplete}
          isGuest={isGuestMode}
        />
      )} */}

      <main className={`max-w-md mx-auto px-6 ${step > 0 ? 'pt-20' : 'pt-12'} pb-24 min-h-screen flex flex-col`}>

        {step === 1 && (
          <div className="flex flex-col gap-6">
            {/* Hero Slideshow Section - Compact with Polaroid Style */}
            <div className="relative w-full bg-theme-bg-secondary p-3 pb-8 rounded-2xl shadow-2xl">
              <div className="relative w-full h-64 overflow-hidden">
                {/* Slideshow */}
                <div className="absolute inset-0">
                  {templatesSource.length > 0 && (
                    <HeroSlideshow templates={templatesSource} onTemplateClick={selectTemplate} />
                  )}
                </div>

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-theme-bg-primary/60 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Text in Polaroid Bottom Space */}
              <div className="absolute bottom-1 left-0 right-0 text-center">
                <h2 className="text-2xl font-black italic text-white">
                  {t('faceSwap.steps.explore')}
                </h2>
              </div>
            </div>

            {/* Modo Browse Templates (Carruseles por Categoría) */}
            <>
              {/* Carruseles por Categoría (Dinámicos) */}
              <div className="flex flex-col gap-6">
                {/* Trending (siempre primero) */}
                {templatesByCategory.trending?.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Flame size={18} className="text-pink-500" />
                      <h3 className="text-lg font-black italic uppercase">{t('templates.categories.trending')}</h3>
                    </div>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                      {templatesByCategory.trending.map((template) => (
                        <TemplateCarousel
                          key={template.id}
                          images={getTemplateVariants(template)}
                          title={template.title}
                          onClick={() => selectTemplate(template)}
                          className="flex-shrink-0 w-[140px] aspect-[3/4.5] rounded-2xl border border-white/5"
                          interval={1200}
                          transition={template.transition || 'fade'}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Resto de categorías dinámicamente - ordenadas por cantidad */}
                {sortedCategories.map((category) => {
                  const templates = templatesByCategory[category];
                  if (!templates || templates.length === 0) return null;

                  const config = categoryConfig[category] || categoryConfig.default;
                  const Icon = config.icon;

                  return (
                    <div key={category} className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <Icon size={18} className={config.color} />
                        <h3 className="text-lg font-black italic uppercase">
                          {t(`templates.categories.${category}`) || category}
                        </h3>
                      </div>
                      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                        {templates.map((template) => (
                          <TemplateCarousel
                            key={template.id}
                            images={getTemplateVariants(template)}
                            title={template.title}
                            onClick={() => selectTemplate(template)}
                            className="flex-shrink-0 w-[140px] aspect-[3/4.5] rounded-2xl border border-white/5"
                            interval={1200}
                            transition={template.transition || 'fade'}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Upload Scene Card - Al final */}
              <div className="relative overflow-hidden rounded-3xl bg-theme-bg-secondary border border-theme p-6 flex items-center justify-between group active:scale-95 transition-all">
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'target')} className="absolute inset-0 opacity-0 z-10 cursor-pointer" />
                <div className="flex flex-col gap-1">
                  <p className="text-lg font-black italic uppercase">{t('templates.uploadScene')}</p>
                  <p className="text-xs text-gray-500">{t('templates.uploadSceneDesc')}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center">
                  <Upload size={20} className="text-white" />
                </div>
              </div>
            </>
          </div>
        )}

        {step === 1.5 && selectedTemplate && (
          <div className="flex flex-col flex-1 gap-6">
            {/* Header */}
            <div className="text-center">
              <h2 className="text-4xl font-black mb-2 italic uppercase">
                {t('templates.selectVariant') || 'Elige una Versión'}
              </h2>
              <p className="text-gray-500 font-medium">
                {selectedTemplate.title}
              </p>
            </div>

            {/* Variantes Grid */}
            <div className="grid grid-cols-2 gap-4">
              {getTemplateVariants(selectedTemplate).map((variantUrl, index) => (
                <div
                  key={index}
                  onClick={() => selectVariant(variantUrl, index)}
                  className={`relative aspect-[3/4.5] rounded-2xl overflow-hidden border-2 cursor-pointer active:scale-95 transition-all ${
                    selectedVariantIndex === index
                      ? 'border-pink-500 shadow-xl shadow-pink-500/30'
                      : 'border-white/10 hover:border-pink-500/50'
                  }`}
                >
                  {/* Imagen de la variante */}
                  <img
                    src={variantUrl}
                    alt={`Variante ${index + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  {/* Badge de número */}
                  <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center">
                    <span className="text-white font-black text-sm">{index + 1}</span>
                  </div>

                  {/* Checkmark si está seleccionada */}
                  {selectedVariantIndex === index && (
                    <div className="absolute inset-0 bg-pink-500/20 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-pink-500 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={3}
                          stroke="currentColor"
                          className="w-10 h-10 text-white"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Botón para volver */}
            <Button
              variant="secondary"
              onClick={() => {
                setStep(1);
                setSelectedTemplate(null);
              }}
              className="mt-auto"
            >
              <ChevronRight size={20} className="rotate-180" /> {t('common.back')}
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col flex-1 gap-6">
            {isGroupPhoto ? (
              /* Multi-slot upload for group/multi-subject templates */
              <>
                <MultiFaceUpload
                  slots={selectedTemplate?.slots}
                  faceCount={selectedTemplate?.faceCount || 2}
                  onImagesSelected={(images) => {
                    setGroupImages(images);
                    setSourceImg(images[0]);
                  }}
                  templatePreview={targetImg || undefined}
                />
                <div className="flex flex-col gap-3">
                  <Button onClick={startProcessing} disabled={groupImages.length === 0} className="h-16 bg-white text-black text-xl italic font-black uppercase">
                    {t('faceSwap.buttons.generate')} <Zap size={22} fill="currentColor" />
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setStep(1);
                      setSelectedTemplate(null);
                      setGroupImages([]);
                      setSourceImg(null);
                    }}
                  >
                    <ChevronRight size={20} className="rotate-180" /> {t('common.back')}
                  </Button>
                </div>
              </>
            ) : (
              /* Single face upload (existing flow) */
              <>
                <div className="text-center">
                  <h2 className="text-4xl font-black mb-2 italic uppercase">{t('faceSwap.steps.readyToGenerate')}</h2>
                  <p className="text-gray-500 font-medium">{t('faceSwap.steps.readyToGenerateDesc')}</p>
                </div>

                <div className="flex flex-col gap-4 items-center">
                  {targetImg && (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-full max-w-[280px] aspect-[3/4.5] rounded-3xl overflow-hidden border-2 border-pink-500/50 shadow-xl shadow-pink-500/20">
                        <img src={targetImg} className="w-full h-full object-cover" alt="Template" />
                      </div>
                      <p className="text-sm text-pink-500 font-black uppercase tracking-wider">{selectedTemplate?.title || 'Template'}</p>
                    </div>
                  )}

                  <ChevronRight className="text-pink-500 rotate-90" size={32} />

                  <div className="flex flex-col items-center gap-2">
                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/10 cursor-pointer hover:border-pink-500/50 transition-all">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'source')}
                        className="absolute inset-0 opacity-0 z-10 cursor-pointer"
                      />
                      {sourceImg ? (
                        <img src={sourceImg} className="w-full h-full object-cover" alt="Your face" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/5">
                          <Camera size={32} className="text-white/30" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 font-bold uppercase">
                      {sourceImg ? t('faceSwap.steps.yourFace') : 'Click to upload'}
                    </p>
                  </div>
                </div>

                <div className="mt-auto flex flex-col gap-3">
                  <Button onClick={startProcessing} disabled={!sourceImg} className="h-16 bg-white text-black text-xl italic font-black uppercase">
                    {t('faceSwap.buttons.generate')} <Zap size={22} fill="currentColor" />
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setStep(1);
                      setSelectedTemplate(null);
                      setSourceImg(null);
                    }}
                  >
                    <ChevronRight size={20} className="rotate-180" /> {t('common.back')}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="relative w-48 h-48 mb-12">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="96" cy="96" r="86" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={540} strokeDashoffset={540 - (540 * processingProgress) / 100} className="text-pink-600 transition-all duration-300" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl font-black italic tracking-tighter">{processingProgress}%</span>
              </div>
            </div>

            {isGroupPhoto && groupSwapProgress ? (
              <>
                <h3 className="text-3xl font-black italic uppercase">{t('groupPhotos.processing.title')}</h3>
                <p className="text-gray-500 text-sm mt-2">
                  {t('groupPhotos.processing.swapping', {
                    current: groupSwapProgress.currentFace,
                    total: groupSwapProgress.totalFaces
                  })}
                </p>
                {groupSwapProgress.currentFace === groupSwapProgress.totalFaces && (
                  <p className="text-pink-500 text-sm mt-1 font-bold">
                    {t('groupPhotos.processing.almostDone')}
                  </p>
                )}
              </>
            ) : (
              <>
                <h3 className="text-3xl font-black italic uppercase">{t('faceSwap.steps.processing')}</h3>
                <p className="text-pink-400 text-base mt-4 font-medium animate-pulse px-6">
                  {processingMessage || flirtMessages[0]}
                </p>
              </>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="flex flex-col flex-1 animate-fade-in">
            <div className="relative aspect-[3/4.5] w-full rounded-[40px] overflow-hidden border border-white/10 mb-6">
              <img src={showComparison ? targetImg || '' : resultImage || ''} className="w-full h-full object-cover" alt="Result" />
              <button
                onMouseDown={() => setShowComparison(true)}
                onMouseUp={() => setShowComparison(false)}
                onTouchStart={() => setShowComparison(true)}
                onTouchEnd={() => setShowComparison(false)}
                className="absolute bottom-6 right-6 w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center"
              >
                <RefreshCw size={24} />
              </button>
            </div>

            {/* Public Gallery Toggle - Solo para usuarios autenticados */}
            {!isGuestMode && currentFaceSwapId && (
              <div className="mb-6">
                <PublicGalleryToggle
                  faceSwapId={currentFaceSwapId}
                  initialIsPublic={false}
                />
              </div>
            )}

            <div className="space-y-4 mt-auto">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (isGuestMode) {
                      setShowLoginGate(true);
                    } else {
                      setStep(1);
                    }
                  }}
                >
                  {t('faceSwap.buttons.newSwap')}
                </Button>
                {isGuestMode ? (
                  <Button onClick={() => setShowLoginGate(true)}>
                    <Download size={20} /> {t('common.download')}
                  </Button>
                ) : (
                  <Button onClick={handleDownloadImage}>
                    <Download size={20} /> {t('common.download')}
                  </Button>
                )}
              </div>
              <div className="flex justify-center">
                <ShareButton
                  type="image"
                  resultImage={resultImage || undefined}
                  caption={aiCaption || undefined}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        user={user}
        onSignOut={signOutUser}
        onShareApp={() => {
          setShowMobileMenu(false);
          setShowShareModal(true);
        }}
        currentLocale={locale}
        onChangeLocale={(newLocale) => {
          router.push(pathname.replace(`/${locale}`, `/${newLocale}`));
        }}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        type="app"
      />

      {/* Version badge */}
      <div className="fixed bottom-4 right-4 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-xs text-gray-400 z-50">
        v2.4.0
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
      `}</style>
    </div>
  );
}
