'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Check, Sparkles, Palette, Image } from 'lucide-react';
import type { PromptInterpretation } from './PromptStudio';

interface PromptSuggestionsProps {
  interpretation: PromptInterpretation;
  availableTemplates: any[];
  onSelectTemplate: (template: any) => void;
  onSelectStyle: (styleId: string) => void;
  onContinue: () => void;
}

export function PromptSuggestions({
  interpretation,
  availableTemplates,
  onSelectTemplate,
  onSelectStyle,
  onContinue
}: PromptSuggestionsProps) {
  const t = useTranslations();
  const [selectedTemplate, setSelectedTemplate] = React.useState<any>(null);
  const [selectedStyleId, setSelectedStyleId] = React.useState<string | null>(null);

  // Filtrar templates recomendados
  const recommendedTemplates = availableTemplates.filter(template =>
    interpretation.recommendedTemplates.some(title =>
      template.title.toLowerCase().includes(title.toLowerCase()) ||
      title.toLowerCase().includes(template.title.toLowerCase())
    )
  ).slice(0, 3);

  // Si no hay matches exactos, usar los primeros 3
  const templatesDisplay = recommendedTemplates.length > 0
    ? recommendedTemplates
    : availableTemplates.slice(0, 3);

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    onSelectTemplate(template);
  };

  const handleStyleSelect = (styleId: string) => {
    setSelectedStyleId(styleId);
    onSelectStyle(styleId);
  };

  const handleContinue = () => {
    if (selectedTemplate) {
      onContinue();
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* AI Interpretation Summary */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-600/10 to-purple-600/10 border border-pink-500/20">
        <div className="flex items-start gap-3">
          <Sparkles size={20} className="text-pink-500 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-white mb-2">
              {t('prompts.interpretation.title')}
            </p>
            <p className="text-sm text-gray-300 italic leading-relaxed">
              "{interpretation.userPrompt}"
            </p>
            <div className="mt-3 pt-3 border-t border-white/10 space-y-2 text-xs">
              <div className="flex gap-2">
                <span className="text-gray-500 font-bold min-w-[80px]">
                  {t('prompts.interpretation.scenario')}:
                </span>
                <span className="text-gray-300">{interpretation.scenario}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500 font-bold min-w-[80px]">
                  {t('prompts.interpretation.mood')}:
                </span>
                <span className="text-gray-300">{interpretation.mood}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500 font-bold min-w-[80px]">
                  {t('prompts.interpretation.lighting')}:
                </span>
                <span className="text-gray-300">{interpretation.lighting}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Templates */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Image size={18} className="text-pink-500" />
          <h3 className="font-bold text-lg">
            {t('prompts.suggestions.templates')}
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {templatesDisplay.map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
              className={`relative aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all active:scale-95 ${
                selectedTemplate?.id === template.id
                  ? 'border-pink-500 ring-2 ring-pink-500/50'
                  : 'border-white/10 hover:border-pink-500/50'
              }`}
            >
              <img
                src={template.url}
                alt={template.title}
                className="w-full h-full object-cover"
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

              {/* Title */}
              <p className="absolute bottom-2 left-2 right-2 text-[9px] font-bold uppercase leading-tight">
                {template.title}
              </p>

              {/* Check mark */}
              {selectedTemplate?.id === template.id && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center">
                  <Check size={14} className="text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Recommended Styles */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Palette size={18} className="text-purple-500" />
          <h3 className="font-bold text-lg">
            {t('prompts.suggestions.styles')}
          </h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {interpretation.recommendedStyles.slice(0, 5).map((styleId) => (
            <button
              key={styleId}
              onClick={() => handleStyleSelect(styleId)}
              className={`px-4 py-2 rounded-full font-medium transition-all active:scale-95 ${
                selectedStyleId === styleId
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white'
                  : 'bg-white/5 border border-white/10 text-gray-300 hover:border-purple-500/50'
              }`}
            >
              {styleId.split('-').map(word =>
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Continue Button */}
      <button
        onClick={handleContinue}
        disabled={!selectedTemplate}
        className="w-full h-16 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 font-bold text-lg italic uppercase flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-pink-500/30 transition-all active:scale-95"
      >
        <Check size={24} />
        {t('prompts.suggestions.continue')}
      </button>
    </div>
  );
}
