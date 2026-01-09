'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  AI_STYLES,
  STYLE_CATEGORIES,
  getStylesByCategory,
  type StyleConfig,
  type StyleCategory
} from '@/lib/styles/style-configs';
import { Sparkles, Crown } from 'lucide-react';

interface StyleSelectorProps {
  selectedStyle: StyleConfig;
  onSelectStyle: (style: StyleConfig) => void;
  previewImage?: string | null;
}

export function StyleSelector({ selectedStyle, onSelectStyle, previewImage }: StyleSelectorProps) {
  const t = useTranslations();
  const [activeCategory, setActiveCategory] = useState<StyleCategory | 'all'>('all');

  // Filtrar estilos por categoría
  const filteredStyles = activeCategory === 'all'
    ? AI_STYLES
    : getStylesByCategory(activeCategory);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-black italic uppercase mb-1">
          {t('faceSwap.steps.customizeStyle')}
        </h2>
        <p className="text-sm text-gray-500">
          {filteredStyles.length} {t('styles.allStyles').toLowerCase()}
        </p>
      </div>

      {/* Preview Image */}
      {previewImage && (
        <div className="relative aspect-[3/4] w-full rounded-[40px] overflow-hidden bg-black border border-white/10">
          <img
            src={previewImage}
            className="w-full h-full object-cover"
            alt="Preview"
          />

          {/* Selected Style Badge */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <div className="px-4 py-2 bg-black/70 backdrop-blur-md rounded-full border border-white/10">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${selectedStyle.color}`} />
                <span className="text-xs font-bold">{selectedStyle.name}</span>
                {selectedStyle.isPremium && (
                  <Crown size={12} className="text-yellow-400" />
                )}
                {selectedStyle.isNew && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-pink-600 font-black">
                    {t('styles.new').toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Style Description */}
          <div className="absolute bottom-4 left-4 right-4 p-4 bg-black/70 backdrop-blur-md rounded-2xl border border-white/10">
            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">
              {selectedStyle.icon} {selectedStyle.category.toUpperCase()}
            </p>
            <p className="text-xs italic text-white/90">{selectedStyle.description}</p>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => setActiveCategory('all')}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold border transition-all ${
            activeCategory === 'all'
              ? 'bg-white text-black border-white'
              : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'
          }`}
        >
          <Sparkles size={14} className="inline mr-1" />
          {t('styles.allStyles')}
        </button>

        {STYLE_CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold border whitespace-nowrap transition-all ${
              activeCategory === category.id
                ? 'bg-white text-black border-white'
                : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'
            }`}
          >
            {category.icon} {t(`styles.categories.${category.id}`)}
          </button>
        ))}
      </div>

      {/* Styles Grid */}
      <div className="grid grid-cols-3 gap-3 max-h-[400px] overflow-y-auto no-scrollbar pb-4">
        {filteredStyles.map((style) => (
          <button
            key={style.id}
            onClick={() => onSelectStyle(style)}
            className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all active:scale-95 ${
              selectedStyle.id === style.id
                ? 'bg-white/10 border-white scale-105'
                : 'bg-white/5 border-white/10 hover:border-white/30'
            }`}
          >
            {/* Style Color Circle */}
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${style.color} flex items-center justify-center text-2xl shadow-lg ${
              selectedStyle.id === style.id ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''
            }`}>
              {style.icon}
            </div>

            {/* Style Name */}
            <span className={`text-[10px] font-bold text-center leading-tight ${
              selectedStyle.id === style.id ? 'text-white' : 'text-gray-400'
            }`}>
              {style.name}
            </span>

            {/* Badges */}
            {(style.isPremium || style.isNew) && (
              <div className="absolute -top-1 -right-1">
                {style.isPremium && (
                  <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
                    <Crown size={10} className="text-black" />
                  </div>
                )}
                {style.isNew && (
                  <div className="px-1.5 py-0.5 rounded-full bg-pink-600 text-[8px] font-black">
                    NEW
                  </div>
                )}
              </div>
            )}

            {/* Selection Indicator */}
            {selectedStyle.id === style.id && (
              <div className="absolute inset-0 rounded-2xl border-2 border-white pointer-events-none" />
            )}
          </button>
        ))}
      </div>

      {/* Style Count */}
      <div className="text-center text-xs text-gray-500">
        {activeCategory === 'all' ? (
          <p>{AI_STYLES.length} estilos disponibles</p>
        ) : (
          <p>{filteredStyles.length} estilos en {t(`styles.categories.${activeCategory}`).toLowerCase()}</p>
        )}
      </div>
    </div>
  );
}
