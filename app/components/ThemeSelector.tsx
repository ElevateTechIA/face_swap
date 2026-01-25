'use client';

import React from 'react';
import { useTheme } from '@/app/contexts/ThemeContext';
import { themes, ThemeId } from '@/lib/themes/theme-config';
import { Palette } from 'lucide-react';

export function ThemeSelector() {
  const { themeId, setTheme } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/10"
        aria-label="Change theme"
      >
        <Palette size={20} className="text-gray-300" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Theme Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="p-4">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Palette size={16} />
                Choose Theme
              </h3>

              <div className="space-y-2">
                {Object.values(themes).map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => {
                      setTheme(theme.id);
                      setIsOpen(false);
                    }}
                    className={`w-full p-3 rounded-xl transition-all border ${
                      themeId === theme.id
                        ? 'border-white/30 bg-white/10'
                        : 'border-white/5 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Theme Preview */}
                      <div
                        className="w-10 h-10 rounded-lg flex-shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${theme.colors.primaryFrom}, ${theme.colors.primaryTo})`,
                        }}
                      />

                      {/* Theme Info */}
                      <div className="flex-1 text-left">
                        <div className="font-bold text-sm text-white">
                          {theme.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {theme.description}
                        </div>
                      </div>

                      {/* Active Indicator */}
                      {themeId === theme.id && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
