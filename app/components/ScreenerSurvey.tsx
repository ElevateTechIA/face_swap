'use client';

import React, { useState, useEffect } from 'react';
import { SCREENER_QUESTIONS, BodyType, Occasion, Mood, StyleTag } from '@/types/template';
import {
  Sparkles, Check, Loader2, Heart, Users, UserCircle, Cake,
  Coffee, Briefcase, Music, Smile, Zap, Eye, Crown, Shirt, Flame, Camera
} from 'lucide-react';

interface ScreenerSurveyProps {
  onComplete: (answers: ScreenerAnswers) => void;
  processingProgress: number; // 0-100
}

export interface ScreenerAnswers {
  bodyType: BodyType[];
  occasions: Occasion[];
  mood: Mood[];
  stylePreference: StyleTag[];
}

// Icon mapping
const ICON_MAP: Record<string, any> = {
  Dumbbell: Zap,
  User: UserCircle,
  Heart: Heart,
  Users: Users,
  UserCircle: UserCircle,
  Sparkles: Sparkles,
  Cake: Cake,
  Coffee: Coffee,
  Briefcase: Briefcase,
  Music: Music,
  Wine: Heart,
  Smile: Smile,
  Bolt: Zap,
  Eye: Eye,
  PartyPopper: Sparkles,
  Crown: Crown,
  Shirt: Shirt,
  Flame: Flame,
  Camera: Camera,
};

export function ScreenerSurvey({ onComplete, processingProgress }: ScreenerSurveyProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [showResults, setShowResults] = useState(false);

  const question = SCREENER_QUESTIONS[currentQuestion];
  const isLastQuestion = currentQuestion === SCREENER_QUESTIONS.length - 1;
  const hasAnswered = answers[question.id]?.length > 0;

  // Auto-advance based on processing progress (15s per question = 25% each)
  useEffect(() => {
    if (processingProgress >= 100 && !showResults) {
      handleComplete();
    }
  }, [processingProgress, showResults]);

  const toggleOption = (value: string) => {
    const currentAnswers = answers[question.id] || [];

    if (question.multiSelect) {
      // Multi-select: toggle on/off
      if (currentAnswers.includes(value)) {
        setAnswers({
          ...answers,
          [question.id]: currentAnswers.filter(v => v !== value),
        });
      } else {
        setAnswers({
          ...answers,
          [question.id]: [...currentAnswers, value],
        });
      }
    } else {
      // Single-select: replace
      setAnswers({
        ...answers,
        [question.id]: [value],
      });
    }
  };

  const handleNext = () => {
    if (!hasAnswered) return;

    if (isLastQuestion) {
      handleComplete();
    } else {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleComplete = () => {
    setShowResults(true);

    // Format answers
    const formattedAnswers: ScreenerAnswers = {
      bodyType: (answers.bodyType || []) as BodyType[],
      occasions: (answers.occasions || []) as Occasion[],
      mood: (answers.mood || []) as Mood[],
      stylePreference: (answers.stylePreference || []) as StyleTag[],
    };

    onComplete(formattedAnswers);
  };

  if (showResults) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm">
        <div className="max-w-md w-full mx-4 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center mx-auto mb-6">
            <Check size={40} className="text-white" />
          </div>
          <h2 className="text-3xl font-black mb-3">¡Perfecto!</h2>
          <p className="text-gray-400 mb-6">
            Tus preferencias se guardarán para recomendarte los mejores templates
          </p>
          <div className="flex items-center justify-center gap-3 text-pink-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Finalizando tu Face Swap...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4">
      <div className="max-w-lg w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 uppercase font-bold">
              Mientras procesamos tu imagen...
            </span>
            <span className="text-xs text-pink-400 font-bold">
              {Math.round(processingProgress)}%
            </span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
              style={{ width: `${processingProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-center gap-2 mt-3">
            {SCREENER_QUESTIONS.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentQuestion
                    ? 'w-8 bg-pink-500'
                    : idx < currentQuestion
                    ? 'w-1.5 bg-pink-500/50'
                    : 'w-1.5 bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Question */}
        <div className="bg-gradient-to-br from-gray-900/80 via-black/80 to-gray-900/80 rounded-3xl border border-pink-500/20 p-8 backdrop-blur-sm">
          <div className="text-center mb-8">
            <p className="text-xs text-gray-400 uppercase font-bold mb-2">
              Pregunta {currentQuestion + 1} de {SCREENER_QUESTIONS.length}
            </p>
            <h3 className="text-2xl font-black mb-2">{question.question}</h3>
            <p className="text-sm text-gray-400">
              {question.multiSelect ? 'Selecciona todas las que apliquen' : 'Selecciona una opción'}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-8">
            {question.options.map((option) => {
              const Icon = ICON_MAP[option.icon || 'Sparkles'] || Sparkles;
              const isSelected = answers[question.id]?.includes(option.value);

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleOption(option.value)}
                  className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                    isSelected
                      ? 'border-pink-500 bg-pink-500/10'
                      : 'border-white/10 bg-white/5 hover:border-pink-500/30 hover:bg-white/10'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isSelected
                      ? 'bg-pink-500 text-white'
                      : 'bg-white/5 text-gray-400'
                  }`}>
                    <Icon size={24} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                      {option.label}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            type="button"
            onClick={handleNext}
            disabled={!hasAnswered}
            className={`w-full h-14 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 ${
              hasAnswered
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-xl shadow-pink-500/30 hover:shadow-pink-500/50 active:scale-95'
                : 'bg-white/5 text-gray-600 cursor-not-allowed'
            }`}
          >
            {isLastQuestion ? 'Finalizar' : 'Siguiente'}
          </button>
        </div>

        {/* Skip option */}
        <button
          type="button"
          onClick={handleComplete}
          className="w-full mt-4 py-3 text-sm text-gray-500 hover:text-gray-400 transition-colors"
        >
          Saltar encuesta
        </button>
      </div>
    </div>
  );
}
