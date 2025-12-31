'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth/AuthProvider';
import { CreditsDisplay } from '@/app/components/CreditsDisplay';
import { InsufficientCreditsModal } from '@/app/components/InsufficientCreditsModal';
import { LoginGateModal } from '@/app/components/LoginGateModal';
// import { DynamicScreenerSurvey } from '@/app/components/DynamicScreenerSurvey'; // TEMPORALMENTE DESHABILITADO
import { LanguageSwitcher } from '@/app/components/LanguageSwitcher';
import { ShareButton } from '@/app/components/ShareButton';
import { ShareModal } from '@/app/components/modals/ShareModal';
import { MobileMenu } from '@/app/components/MobileMenu';
import { canUseGuestTrial, markGuestTrialAsUsed, getGuestTrialStatus } from '@/lib/guest-trial';
import {
  Upload, Sparkles, Camera, Download, RefreshCw, ChevronRight, X,
  Grid, Flame, Layers, Play, Zap, LogOut, LogIn, History, Menu
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';

// --- Constantes de Encuesta (Onboarding) ---
const SURVEY_QUESTIONS = [
  {
    id: 1,
    question: "¿Cuál es tu objetivo principal?",
    subtitle: "Personalizaremos la IA según tu meta.",
    options: [
      { id: 'fun', text: "Divertirme y reír", icon: "😂" },
      { id: 'beauty', text: "Mejorar mis fotos", icon: "✨" },
      { id: 'content', text: "Crear contenido", icon: "📸" },
      { id: 'explore', text: "Probar estilos nuevos", icon: "🎨" }
    ]
  },
  {
    id: 2,
    question: "¿Qué estilo te define mejor?",
    subtitle: "Para sugerirte los mejores filtros.",
    options: [
      { id: 'chic', text: "Chic & Glamour", icon: "💎" },
      { id: 'urban', text: "Urbano & Street", icon: "👟" },
      { id: 'vintage', text: "Retro & Vintage", icon: "🎞️" },
      { id: 'fantasy', text: "Fantasía & Cosplay", icon: "🦄" }
    ]
  },
  {
    id: 3,
    question: "¿Con quién te identificas?",
    subtitle: "Ajustaremos los modelos base.",
    options: [
      { id: 'female', text: "Femenino", icon: "👩" },
      { id: 'male', text: "Masculino", icon: "👨" },
      { id: 'nb', text: "No Binario / Otro", icon: "🌈" }
    ]
  }
];

// --- Categorías de Contenido (las traducciones se obtienen dinámicamente) ---
const CATEGORY_IDS = [
  { id: 'all', icon: <Grid size={14}/> },
  { id: 'trending', icon: <Flame size={14}/> },
  { id: 'editorial', icon: <Layers size={14}/> },
  { id: 'cinematic', icon: <Play size={14}/> },
];

// --- Plantillas ---
const TEMPLATES = [
  { id: 't1', url: '/templates/Midnight Celebration.jpg', title: 'Midnight Celebration', category: 'cinematic', trending: true },
  { id: 't2', url: '/templates/The Champagne Toast.jpg', title: 'The Champagne Toast', category: 'editorial', trending: true },
  { id: 't3', url: '/templates/Red Velvet Euphoria.jpg', title: 'Red Velvet Euphoria', category: 'editorial', trending: true },
  { id: 't4', url: '/templates/City Lights Glam.jpg', title: 'City Lights Glam', category: 'editorial', trending: false },
  { id: 't5', url: '/templates/Confetti Party.jpg', title: 'Confetti Party', category: 'cinematic', trending: false },
  { id: 't6', url: '/templates/Elegant Countdown.jpg', title: 'Elegant Countdown', category: 'editorial', trending: false },
];

// --- Estilos de IA ---
const STYLES = [
  { id: 'natural', name: 'Natural', color: 'from-green-400 to-emerald-600', filter: 'none' },
  { id: 'glam', name: 'Glamour', color: 'from-pink-500 to-rose-500', filter: 'contrast(1.1) saturate(1.3) brightness(1.1)' },
  { id: 'cyber', name: 'Cyberpunk', color: 'from-blue-500 to-cyan-500', filter: 'hue-rotate(180deg) contrast(1.2)' },
  { id: 'vintage', name: '90s Retro', color: 'from-yellow-400 to-orange-500', filter: 'sepia(0.4) contrast(0.9) brightness(0.9)' },
  { id: 'bw', name: 'Noir', color: 'from-gray-400 to-gray-600', filter: 'grayscale(1) contrast(1.2)' },
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
  const [step, setStep] = useState(-1); // -1 = login, 0 = encuesta, 1+ = app
  const [sourceImg, setSourceImg] = useState<string | null>(null);
  const [targetImg, setTargetImg] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof TEMPLATES[0] | null>(null);
  const [activeCategory, setActiveCategory] = useState('editorial');
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0]);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiCaption, setAiCaption] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [surveyIndex, setSurveyIndex] = useState(0);
  const [isSurveyLoading, setIsSurveyLoading] = useState(false);
  const [surveyAnswers, setSurveyAnswers] = useState<Record<number, string>>({});
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

  // Cargar templates dinámicos desde Firebase
  useEffect(() => {
    loadTemplates();
  }, [user, activeCategory]); // Recargar cuando cambie el usuario o la categoría

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true);

      // Determinar el modo según el usuario y la categoría activa
      let mode = 'all';
      let occasion = null;

      if (activeCategory === 'trending') {
        mode = 'trending';
      } else if (activeCategory === 'all' && user) {
        mode = 'recommended'; // Recomendaciones personalizadas para usuarios autenticados
      } else if (activeCategory !== 'all' && activeCategory !== 'trending') {
        occasion = activeCategory; // Filtrar por ocasión
      }

      // Construir URL con parámetros
      const params = new URLSearchParams();
      params.set('mode', mode);
      if (occasion) params.set('occasion', occasion);

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
      loadPreferences();
      loadUserCredits();
      checkUserProfile();
      setIsGuestMode(false);
    } else {
      // Modo guest - verificar si es primera visita
      setIsGuestMode(true);
      setGuestTrialAvailable(canUseGuestTrial());

      // Verificar si el guest ya completó la encuesta inicial
      const hasCompletedSurvey = localStorage.getItem('guestSurveyCompleted');
      if (!hasCompletedSurvey) {
        setStep(0); // Mostrar encuesta inicial
      } else {
        setStep(1); // Ir directamente a templates
      }
      setLoadingCredits(false);
    }
  }, [user, authLoading]);

  const loadPreferences = async () => {
    try {
      const token = await getUserIdToken();
      if (!token) {
        setStep(-1);
        return;
      }
      const response = await fetch('/api/preferences', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.preferences) {
          setSurveyAnswers(data.preferences);
          setStep(1); // Ir directo a la app si ya tiene preferencias
        } else {
          setStep(0); // Mostrar encuesta si no tiene preferencias
        }
      } else if (response.status === 401) {
        setStep(-1);
      } else {
        setStep(0);
      }
    } catch (error) {
      setStep(0);
    }
  };

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

  const savePreferences = async (preferences: Record<number, string>) => {
    try {
      const token = await getUserIdToken();
      if (!token) return;
      await fetch('/api/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(preferences),
      });
    } catch (error) {
      console.error('Error guardando preferencias:', error);
    }
  };

  const analyzeStyle = async () => {
    if (!sourceImg) return;
    setIsAiLoading(true);
    try {
      const token = await getUserIdToken();
      const response = await fetch('/api/ai/analyze-style', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ image: sourceImg }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiAnalysis(data.analysis);
      } else {
        setAiAnalysis("¡Tienes un rostro increíble! Te sugerimos probar el estilo Glamour.");
      }
    } catch (e) {
      setAiAnalysis("¡Tienes un rostro increíble! Te sugerimos probar el estilo Glamour.");
    } finally {
      setIsAiLoading(false);
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

  const handleSurveyOption = (optionId: string) => {
    const newAnswers = { ...surveyAnswers, [surveyIndex + 1]: optionId };
    setSurveyAnswers(newAnswers);

    if (surveyIndex < SURVEY_QUESTIONS.length - 1) {
      setSurveyIndex(prev => prev + 1);
    } else {
      setIsSurveyLoading(true);

      // Guardar preferencias si es usuario autenticado
      if (!isGuestMode) {
        savePreferences(newAnswers);
      } else {
        // Para guests, guardar en localStorage que completaron la encuesta
        localStorage.setItem('guestSurveyCompleted', 'true');
        localStorage.setItem('guestSurveyAnswers', JSON.stringify(newAnswers));
      }

      setTimeout(() => {
        setIsSurveyLoading(false);
        setStep(1);
      }, 1000);
    }
  };

  const selectTemplate = async (template: typeof TEMPLATES[0]) => {
    setProcessingProgress(10);
    setSelectedTemplate(template);

    // Si es una URL de Firebase Storage (https://), enviarla directamente al servidor
    // El servidor se encargará de convertirla a base64 sin problemas de CORS
    if (template.url.startsWith('http://') || template.url.startsWith('https://')) {
      console.log('🌐 Template is a URL, will be processed on server:', template.url);
      setTargetImg(template.url); // Guardar la URL directamente
      setStep(2);
      setProcessingProgress(0);
      return;
    }

    // Si es una ruta local (/templates/...), convertir a base64 en el navegador
    try {
      const base64 = await urlToBase64(template.url);
      console.log('✅ Template converted to base64:', base64.substring(0, 50) + '...');
      setTargetImg(base64);
      setStep(2);
    } catch (e) {
      console.error('❌ Error converting template to base64:', e);
      alert('Error al cargar la imagen del template. Por favor, intenta de nuevo.');
      setProcessingProgress(0);
      return; // No avanzar si falló la conversión
    }
    setProcessingProgress(0);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'source' | 'target') => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecciona un archivo de imagen válido.');
        return;
      }

      console.log(`📤 Uploading ${type} image:`, file.name, file.type, file.size, 'bytes');

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;

        // Validar que el resultado sea un data URL válido
        if (!result || !result.includes(',')) {
          console.error('❌ FileReader produced invalid result');
          alert('Error al cargar la imagen. Por favor, intenta con otra imagen.');
          return;
        }

        console.log(`✅ ${type} image loaded:`, result.substring(0, 50) + '...');

        if (type === 'source') {
          setSourceImg(result);
          setAiAnalysis(null);
        } else {
          setTargetImg(result);
          setStep(2);
        }
      };

      reader.onerror = () => {
        console.error('❌ FileReader error:', reader.error);
        alert('Error al leer la imagen. Por favor, intenta de nuevo.');
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
      alert('Error: Imágenes no cargadas correctamente');
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
      alert('Error: Formato de imagen inválido. Por favor, intenta subir las imágenes de nuevo.');
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
        const error = await response.json();
        console.error('❌ Error response:', error);
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
          setStep(5);
          console.log('✅ Face Swap completado - mostrando resultado');
        }, 1000);
      } else {
        throw new Error('Error en el procesamiento');
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      console.error('❌ Error en Face Swap:', error);
      alert('Error procesando imagen. Por favor, intenta de nuevo.');
      setShowScreenerSurvey(false);
      setIsProcessingFaceSwap(false);
      setProcessingProgress(0);
      setStep(3);
    }
  };

  const startProcessing = async () => {
    // Si es guest mode
    if (isGuestMode) {
      if (guestTrialAvailable) {
        setStep(4);
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

    setStep(4);
    await processFaceSwapOnServer(false); // Authenticated
  };

  // Usar templates dinámicos si están disponibles, sino usar fallback hardcodeado
  const templatesSource = dynamicTemplates.length > 0 ? dynamicTemplates.map(t => ({
    id: t.id,
    url: t.imageUrl,
    title: t.title,
    category: t.metadata?.occasion?.[0] || 'all',
    trending: (t.usageCount || 0) > 5
  })) : TEMPLATES;

  const filteredTemplates = templatesSource;

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
        <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-14 bg-black/70 backdrop-blur-2xl border-b border-white/10 z-50 flex items-center justify-between px-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setStep(1)}>
            <div className="w-8 h-8 bg-gradient-to-tr from-pink-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-lg tracking-tighter italic uppercase">GLAMOUR</span>
          </div>

          <div className="flex items-center gap-3">
            {isGuestMode ? (
              // Guest mode - solo botón de login y menu
              <>
                <button
                  onClick={async () => {
                    setIsSigningIn(true);
                    try {
                      await signInWithGoogle();
                    } catch (error) {
                      console.error('Error al iniciar sesión:', error);
                    } finally {
                      setIsSigningIn(false);
                    }
                  }}
                  disabled={isSigningIn}
                  className="px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white text-sm font-bold active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSigningIn ? (
                    <RefreshCw className="animate-spin" size={14} />
                  ) : (
                    <>
                      <LogIn size={14} />
                      <span>{t('common.enter')}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowMobileMenu(true)}
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                  aria-label="Menú"
                >
                  <Menu size={18} />
                </button>
              </>
            ) : (
              // Usuario autenticado - mostrar créditos y menú
              <>
                <CreditsDisplay credits={userCredits} loading={loadingCredits} />
                <button
                  onClick={() => setShowMobileMenu(true)}
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                  aria-label="Menú"
                >
                  <Menu size={18} />
                </button>
              </>
            )}
          </div>
        </header>
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

        {step === 0 && (
          <div className="flex flex-col flex-1">
            {isSurveyLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <Sparkles className="w-12 h-12 text-pink-500 animate-pulse mb-4" />
                <h2 className="text-2xl font-black italic">{t('survey.initial.calibrating')}</h2>
              </div>
            ) : (
              <>
                <div className="mb-12">
                  <h1 className="text-5xl font-black tracking-tighter leading-none mb-4 uppercase italic">
                    {t('survey.initial.title')}<br/>
                    <span className="text-pink-600">{t('survey.initial.titleHighlight')}</span>
                  </h1>
                  <p className="text-gray-400 font-medium">{t('survey.initial.subtitle')}</p>
                </div>
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold mb-6">{t(`survey.initial.questions.q${surveyIndex + 1}.question`)}</h2>
                  <p className="text-gray-500 text-sm mb-4">{t(`survey.initial.questions.q${surveyIndex + 1}.subtitle`)}</p>
                  <div className="grid gap-3">
                    {SURVEY_QUESTIONS[surveyIndex].options.map((opt) => (
                      <Button key={opt.id} variant="survey" onClick={() => handleSurveyOption(opt.id)}>
                        <span className="text-2xl mr-4">{opt.icon}</span>
                        <span className="font-bold text-lg">{t(`survey.initial.questions.q${surveyIndex + 1}.options.${opt.id}`)}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-6">
            <h2 className="text-3xl font-black italic">{t('faceSwap.steps.explore')}</h2>
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
              {CATEGORY_IDS.map(cat => (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold border ${activeCategory === cat.id ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-white/10'}`}>
                  {t(`templates.categories.${cat.id}`)}
                </button>
              ))}
            </div>

            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-black border border-white/10 p-6 flex items-center justify-between group active:scale-95 transition-all">
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'target')} className="absolute inset-0 opacity-0 z-10 cursor-pointer" />
              <div className="flex flex-col gap-1">
                <p className="text-lg font-black italic uppercase">{t('templates.uploadScene')}</p>
                <p className="text-xs text-gray-500">{t('templates.uploadSceneDesc')}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-pink-600 flex items-center justify-center">
                <Upload size={20} className="text-white" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {filteredTemplates.map((template) => (
                <div key={template.id} onClick={() => selectTemplate(template)} className="relative aspect-[3/4.5] rounded-3xl overflow-hidden border border-white/5 active:scale-95 transition-all cursor-pointer">
                  <img src={template.url} className="w-full h-full object-cover" alt={template.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
                  <p className="absolute bottom-4 left-4 text-[10px] font-black uppercase tracking-widest">{template.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col flex-1 gap-6">
            <div className="text-center">
              <h2 className="text-4xl font-black mb-2 italic uppercase">{t('faceSwap.steps.yourFace')}</h2>
              <p className="text-gray-500 font-medium">{t('faceSwap.steps.yourFaceDesc')}</p>
            </div>

            <div className="relative mx-auto w-full aspect-square max-w-[280px]">
              <div className={`w-full h-full rounded-[60px] border-4 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all duration-500 ${sourceImg ? 'border-pink-500' : 'border-white/10 bg-white/5'}`}>
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'source')} className="absolute inset-0 opacity-0 z-10 cursor-pointer" />
                {sourceImg ? (
                  <img src={sourceImg} className="w-full h-full object-cover" alt="Selfie" />
                ) : (
                  <Camera size={64} className="text-white/10" />
                )}
              </div>
            </div>

            {sourceImg && (
              <div className="animate-fade-in">
                {!aiAnalysis ? (
                  <Button variant="ai" onClick={analyzeStyle} isLoading={isAiLoading}>
                    ✨ Analizar Rasgos
                  </Button>
                ) : (
                  <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-4 text-sm text-indigo-200 italic">
                    <Sparkles size={14} className="inline mr-2" />
                    &quot;{aiAnalysis}&quot;
                  </div>
                )}
              </div>
            )}

            <Button onClick={() => setStep(3)} disabled={!sourceImg} className="mt-auto h-16 text-xl italic uppercase font-black">
              {t('common.next')} <ChevronRight size={24} />
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col flex-1 gap-6">
            <h2 className="text-2xl font-black text-center italic uppercase">{t('faceSwap.steps.customizeStyle')}</h2>

            <div className="relative aspect-[3/4] w-full rounded-[40px] overflow-hidden bg-black border border-white/10">
              <img src={targetImg || ''} className="w-full h-full object-cover" style={{ filter: selectedStyle.filter }} alt="Preview" />
              <div className="absolute bottom-6 left-6 right-6 p-4 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10">
                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">PROMPT ACTIVO</p>
                <p className="text-[9px] italic text-pink-500 line-clamp-2 leading-relaxed">&quot;A high-quality face swap where the face from the second image replaces...&quot;</p>
              </div>
            </div>

            <div className="flex gap-4 overflow-x-auto py-4 no-scrollbar">
              {STYLES.map((s) => (
                <button key={s.id} onClick={() => setSelectedStyle(s)} className={`flex-shrink-0 transition-all ${selectedStyle.id === s.id ? 'scale-110 opacity-100' : 'opacity-40'}`}>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} border-2 ${selectedStyle.id === s.id ? 'border-white' : 'border-transparent'}`} />
                </button>
              ))}
            </div>

            <Button onClick={startProcessing} className="mt-auto h-16 bg-white text-black text-xl italic font-black uppercase">
              {t('faceSwap.buttons.generate')} <Zap size={22} fill="currentColor" />
            </Button>
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
            <h3 className="text-3xl font-black italic uppercase">{t('faceSwap.steps.processing')}</h3>
            <p className="text-gray-500 text-sm mt-2">{t('survey.screener.processing')}</p>
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

            <div className="mb-6">
              {!aiCaption ? (
                <Button variant="ai" onClick={generateCaption} isLoading={isAiLoading}>
                  ✨ Generar Pie de Foto
                </Button>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 italic text-sm text-gray-300">
                  &quot;{aiCaption}&quot;
                </div>
              )}
            </div>

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
                  <a href={resultImage || ''} download="swap_result.png">
                    <Button><Download size={20} /> {t('common.download')}</Button>
                  </a>
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
        v2.2.0
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
