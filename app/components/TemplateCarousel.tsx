'use client';

import React, { useState, useEffect } from 'react';

type TransitionType = 'fade' | 'slide' | 'zoom' | 'flip' | 'blur' | 'rotate';

interface TemplateCarouselProps {
  images: string[]; // Array de URLs de las imágenes
  title: string;
  interval?: number; // Intervalo en milisegundos (default 1200)
  transition?: TransitionType; // Tipo de transición
  className?: string;
  onClick?: () => void;
}

export const TemplateCarousel: React.FC<TemplateCarouselProps> = ({
  images,
  title,
  interval = 1200,
  transition = 'fade', // Default fade
  className = '',
  onClick,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto-rotate entre las imágenes
  useEffect(() => {
    if (images.length <= 1) return;

    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
        setIsTransitioning(false);
      }, 50);
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

  // Función para obtener las clases CSS de transición según el tipo
  const getTransitionClasses = (index: number): string => {
    const isActive = index === currentIndex;
    const baseClasses = 'absolute inset-0';

    switch (transition) {
      case 'fade':
        return `${baseClasses} transition-opacity duration-300 ease-in-out ${
          isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
        }`;

      case 'slide':
        return `${baseClasses} transition-transform duration-300 ease-in-out ${
          isActive
            ? 'translate-x-0 z-10'
            : index < currentIndex
              ? '-translate-x-full z-0'
              : 'translate-x-full z-0'
        }`;

      case 'zoom':
        return `${baseClasses} transition-all duration-300 ease-in-out ${
          isActive
            ? 'opacity-100 scale-100 z-10'
            : 'opacity-0 scale-125 z-0'
        }`;

      case 'flip':
        return `${baseClasses} transition-all duration-300 ease-in-out ${
          isActive
            ? 'opacity-100 rotateY-0 z-10'
            : 'opacity-0 z-0'
        } ${!isActive && '[transform:rotateY(90deg)]'}`;

      case 'blur':
        return `${baseClasses} transition-all duration-300 ease-in-out ${
          isActive
            ? 'opacity-100 blur-0 scale-100 z-10'
            : 'opacity-0 blur-md scale-95 z-0'
        }`;

      case 'rotate':
        return `${baseClasses} transition-all duration-300 ease-in-out ${
          isActive
            ? 'opacity-100 rotate-0 scale-100 z-10'
            : 'opacity-0 rotate-12 scale-90 z-0'
        }`;

      default:
        return `${baseClasses} transition-opacity duration-300 ease-in-out ${
          isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
        }`;
    }
  };

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden active:scale-95 transition-all cursor-pointer ${className}`}
      style={{ perspective: '1000px' }} // Para el efecto flip
    >
      {/* Imágenes del carousel */}
      {images.map((image, index) => (
        <div
          key={index}
          className={getTransitionClasses(index)}
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
