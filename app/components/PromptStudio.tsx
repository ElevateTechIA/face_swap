'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles, Send, Wand2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface PromptStudioProps {
  onInterpretation: (interpretation: PromptInterpretation) => void;
  isLoading?: boolean;
}

export interface PromptInterpretation {
  scenario: string;
  mood: string;
  lighting: string;
  colors: string[];
  recommendedTemplates: string[];
  recommendedStyles: string[];
  generatedPrompt: string;
  userPrompt: string;
}

// Quick prompts pre-definidos
const QUICK_PROMPTS = [
  { id: 'nye-party', emoji: '🎉', textKey: 'prompts.quick.nyeParty' },
  { id: 'beach-sunset', emoji: '🏖️', textKey: 'prompts.quick.beachSunset' },
  { id: 'city-night', emoji: '🌃', textKey: 'prompts.quick.cityNight' },
  { id: 'vintage-glam', emoji: '💄', textKey: 'prompts.quick.vintageGlam' },
  { id: 'cyberpunk', emoji: '🤖', textKey: 'prompts.quick.cyberpunk' },
  { id: 'nature', emoji: '🌲', textKey: 'prompts.quick.nature' },
];

export function PromptStudio({ onInterpretation, isLoading = false }: PromptStudioProps) {
  const t = useTranslations();
  const [prompt, setPrompt] = useState('');
  const [isInterpreting, setIsInterpreting] = useState(false);

  const handleSubmit = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt;

    if (!finalPrompt.trim()) {
      toast.error(t('prompts.errors.empty'));
      return;
    }

    setIsInterpreting(true);

    try {
      const response = await fetch('/api/ai/interpret-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPrompt: finalPrompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to interpret prompt');
      }

      const interpretation: PromptInterpretation = await response.json();
      interpretation.userPrompt = finalPrompt;

      onInterpretation(interpretation);
      toast.success(t('prompts.success.interpreted'));
    } catch (error) {
      console.error('Error interpreting prompt:', error);
      toast.error(t('prompts.errors.failed'));
    } finally {
      setIsInterpreting(false);
    }
  };

  const handleQuickPrompt = (promptKey: string) => {
    const promptText = t(promptKey);
    setPrompt(promptText);
    handleSubmit(promptText);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Wand2 className="w-6 h-6 text-pink-500" />
          <h2 className="text-2xl font-black italic uppercase">
            {t('prompts.title')}
          </h2>
        </div>
        <p className="text-sm text-gray-400">
          {t('prompts.subtitle')}
        </p>
      </div>

      {/* Quick Prompts */}
      <div className="space-y-2">
        <p className="text-xs text-gray-500 uppercase font-bold">
          {t('prompts.quickIdeas')}
        </p>
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((quickPrompt) => (
            <button
              key={quickPrompt.id}
              onClick={() => handleQuickPrompt(quickPrompt.textKey)}
              disabled={isInterpreting || isLoading}
              className="px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:border-pink-500/50 hover:bg-white/10 transition-all text-sm font-medium active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="mr-2">{quickPrompt.emoji}</span>
              {t(quickPrompt.textKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input */}
      <div className="relative">
        <div className="relative rounded-2xl bg-white/5 border border-white/10 focus-within:border-pink-500/50 transition-all">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t('prompts.placeholder')}
            disabled={isInterpreting || isLoading}
            className="w-full bg-transparent px-4 py-4 pr-12 text-white placeholder-gray-500 outline-none resize-none min-h-[120px] max-h-[200px] disabled:opacity-50"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />

          {/* Send Button */}
          <button
            onClick={() => handleSubmit()}
            disabled={!prompt.trim() || isInterpreting || isLoading}
            className="absolute bottom-3 right-3 w-10 h-10 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-pink-500/30 transition-all active:scale-95"
            aria-label={t('prompts.send')}
          >
            {isInterpreting ? (
              <RefreshCw size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>

        {/* Character counter */}
        <div className="flex items-center justify-between mt-2 px-2">
          <p className="text-xs text-gray-500">
            {t('prompts.hint')}
          </p>
          <p className="text-xs text-gray-500">
            {prompt.length}/500
          </p>
        </div>
      </div>

      {/* Examples */}
      <div className="p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/20">
        <div className="flex items-start gap-2">
          <Sparkles size={16} className="text-indigo-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-2 text-sm">
            <p className="font-bold text-indigo-300">
              {t('prompts.examples.title')}
            </p>
            <ul className="space-y-1 text-indigo-200/80">
              <li className="italic">"{t('prompts.examples.ex1')}"</li>
              <li className="italic">"{t('prompts.examples.ex2')}"</li>
              <li className="italic">"{t('prompts.examples.ex3')}"</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Processing indicator */}
      {isInterpreting && (
        <div className="flex items-center justify-center gap-2 text-pink-500 animate-pulse">
          <Wand2 className="animate-spin" size={20} />
          <p className="text-sm font-bold">
            {t('prompts.interpreting')}
          </p>
        </div>
      )}
    </div>
  );
}
