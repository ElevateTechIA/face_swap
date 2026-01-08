'use client';

import React, { useState, useEffect } from 'react';

interface TemplateCarouselProps {
  images: string[]; // Array de URLs de las imágenes
  title: string;
  interval?: number; // Intervalo en milisegundos (default 3000)
  className?: string;
  onClick?: () => void;
}

export const TemplateCarousel: React.FC<TemplateCarouselProps> = ({
  images,
  title,
  interval = 3000,
  className = '',
  onClick,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Auto-rotate entre las imágenes
  useEffect(() => {
    if (images.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval]);

  // Precargar todas las imágenes
  useEffect(() => {
    const imagePromises = images.map((src) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = resolve;
        img.onerror = reject;
      });
    });

    Promise.all(imagePromises)
      .then(() => setIsLoaded(true))
      .catch((err) => {
        console.error('Error precargando imágenes del template:', err);
        setIsLoaded(true); // Mostrar de todos modos
      });
  }, [images]);

  // Si solo hay una imagen, mostrar directamente sin carousel
  if (images.length === 1) {
    return (
      <div
        onClick={onClick}
        className={`relative overflow-hidden active:scale-95 transition-all cursor-pointer ${className}`}
      >
        <img
          src={images[0]}
          className="w-full h-full object-cover"
          alt={title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
        <p className="absolute bottom-3 left-3 right-3 text-[9px] font-black uppercase tracking-widest line-clamp-2">
          {title}
        </p>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden active:scale-95 transition-all cursor-pointer ${className}`}
    >
      {/* Imágenes del carousel */}
      {images.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <img
            src={image}
            className="w-full h-full object-cover"
            alt={`${title} - ${index + 1}`}
          />
        </div>
      ))}

      {/* Overlay y título */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90 z-20 pointer-events-none" />
      <p className="absolute bottom-3 left-3 right-3 text-[9px] font-black uppercase tracking-widest line-clamp-2 z-20">
        {title}
      </p>

      {/* Indicadores de página (dots) */}
      {images.length > 1 && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1 z-20">
          {images.map((_, index) => (
            <div
              key={index}
              className={`w-1 h-1 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-white w-3'
                  : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      )}

      {/* Loading state */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-30">
          <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};
