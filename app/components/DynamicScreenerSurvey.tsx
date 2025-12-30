'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { ScreenerQuestion } from '@/types/template';
import { Check, Loader2 } from 'lucide-react';

interface DynamicScreenerSurveyProps {
  onComplete: () => void;
  isGuest?: boolean;
}

export function DynamicScreenerSurvey({ onComplete, isGuest = false }: DynamicScreenerSurveyProps) {
  const locale = useLocale() as 'es' | 'en'; // Obtener idioma actual
  const [questions, setQuestions] = useState<ScreenerQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar preguntas al montar
  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setIsLoading(true);

      // Obtener 3 preguntas no respondidas
      const response = await fetch('/api/screener-questions?limit=3');

      if (!response.ok) {
        throw new Error('Error al cargar preguntas');
      }

      const data = await response.json();

      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        console.log(`✅ Loaded ${data.questions.length} screener questions`);
      } else {
        // No hay más preguntas - completar
        console.log('✅ No more questions available');
        onComplete();
      }
    } catch (err: any) {
      console.error('❌ Error loading screener questions:', err);
      setError(err.message);
      // Si hay error, completar para no bloquear al usuario
      setTimeout(onComplete, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionSelect = (option: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    const questionId = currentQuestion.id;
    const currentAnswers = answers[questionId] || [];

    let newAnswers: string[];

    if (currentQuestion.multiSelect) {
      // Multi-select: toggle opción
      if (currentAnswers.includes(option)) {
        newAnswers = currentAnswers.filter(a => a !== option);
      } else {
        newAnswers = [...currentAnswers, option];
      }
    } else {
      // Single select: reemplazar
      newAnswers = [option];
    }

    setAnswers({
      ...answers,
      [questionId]: newAnswers,
    });
  };

  const handleNext = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    const questionId = currentQuestion.id;

    // Validar que haya seleccionado al menos una opción
    if (!answers[questionId] || answers[questionId].length === 0) {
      alert('Por favor, selecciona al menos una opción');
      return;
    }

    // Si es la última pregunta, guardar y completar
    if (currentQuestionIndex === questions.length - 1) {
      await saveAnswers();
    } else {
      // Avanzar a la siguiente pregunta
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const saveAnswers = async () => {
    if (isGuest) {
      // Para guests, guardar en localStorage
      const existingAnswers = JSON.parse(localStorage.getItem('guestScreenerAnswers') || '{}');
      const mergedAnswers = { ...existingAnswers, ...answers };
      localStorage.setItem('guestScreenerAnswers', JSON.stringify(mergedAnswers));
      console.log('✅ Guest screener answers saved to localStorage');
      onComplete();
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch('/api/user/screener-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar respuestas');
      }

      console.log('✅ Screener answers saved successfully');
      onComplete();
    } catch (err: any) {
      console.error('❌ Error saving screener answers:', err);
      // Completar de todos modos para no bloquear
      onComplete();
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    console.log('⏭️ User skipped screener survey');
    onComplete();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  if (error || questions.length === 0) {
    return null;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswers = answers[currentQuestion.id] || [];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Obtener la traducción según el idioma actual
  const translation = currentQuestion.translations[locale] || currentQuestion.translations.es;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-3xl p-8">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Pregunta {currentQuestionIndex + 1}/{questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-600 to-purple-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question - Texto dinámico desde Firebase */}
        <h3 className="text-2xl font-bold mb-2">
          {translation.label}
        </h3>
        <p className="text-gray-400 text-sm mb-6">
          {currentQuestion.multiSelect
            ? 'Selecciona una o más opciones'
            : 'Selecciona una opción'}
        </p>

        {/* Options - Textos dinámicos desde Firebase */}
        <div className="space-y-3 mb-6">
          {currentQuestion.optionKeys.map((optionKey) => {
            const isSelected = currentAnswers.includes(optionKey);
            const optionLabel = translation.options[optionKey] || optionKey;

            return (
              <button
                key={optionKey}
                onClick={() => handleOptionSelect(optionKey)}
                className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between ${
                  isSelected
                    ? 'border-pink-500 bg-pink-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <span className="font-medium">
                  {optionLabel}
                </span>
                {isSelected && (
                  <Check className="w-5 h-5 text-pink-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            className="px-4 py-3 rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all"
          >
            Saltar
          </button>
          <button
            onClick={handleNext}
            disabled={isSaving || currentAnswers.length === 0}
            className="flex-1 px-6 py-3 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                {currentQuestionIndex === questions.length - 1
                  ? 'Continuar'
                  : 'Siguiente'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
