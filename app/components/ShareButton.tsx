'use client';

import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import { ShareModal } from './modals/ShareModal';

interface ShareButtonProps {
  type: 'app' | 'image';
  resultImage?: string;
  caption?: string;
}

export function ShareButton({ type, resultImage, caption }: ShareButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/20 transition-all active:scale-95"
        title={type === 'app' ? 'Compartir App' : 'Compartir Imagen'}
        aria-label={type === 'app' ? 'Compartir App' : 'Compartir Imagen'}
      >
        <Share2 size={16} />
      </button>

      <ShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={type}
        resultImage={resultImage}
        caption={caption}
      />
    </>
  );
}
