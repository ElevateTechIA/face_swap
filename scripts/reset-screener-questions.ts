/**
 * Script para ELIMINAR todas las preguntas del screener y volver a crearlas
 * con el nuevo formato de traducciones dinámicas
 *
 * Uso:
 * npx tsx scripts/reset-screener-questions.ts
 */

import { getAdminFirestore } from '../lib/firebase/admin';

const INITIAL_QUESTIONS = [
  // 1. Tipo de cuerpo
  {
    multiSelect: true,
    category: 'preferences' as const,
    optionKeys: ['slim', 'athletic', 'curvy', 'average', 'plus-size'],
    translations: {
      es: {
        label: '¿Qué tipo de cuerpo prefieres en los resultados?',
        options: {
          slim: 'Delgado',
          athletic: 'Atlético',
          curvy: 'Curvy',
          average: 'Promedio',
          'plus-size': 'Plus Size',
        },
      },
      en: {
        label: 'What body type do you prefer in results?',
        options: {
          slim: 'Slim',
          athletic: 'Athletic',
          curvy: 'Curvy',
          average: 'Average',
          'plus-size': 'Plus Size',
        },
      },
    },
    isActive: true,
    order: 1,
  },

  // 2. Ocasiones
  {
    multiSelect: true,
    category: 'occasions' as const,
    optionKeys: ['new-year', 'birthday', 'wedding', 'party', 'date', 'professional', 'casual', 'vacation', 'festival'],
    translations: {
      es: {
        label: '¿Para qué ocasiones usarías Face Swaps?',
        options: {
          'new-year': 'Año Nuevo',
          birthday: 'Cumpleaños',
          wedding: 'Boda',
          party: 'Fiesta',
          date: 'Cita',
          professional: 'Profesional',
          casual: 'Casual',
          vacation: 'Vacaciones',
          festival: 'Festival',
        },
      },
      en: {
        label: 'For what occasions would you use Face Swaps?',
        options: {
          'new-year': 'New Year',
          birthday: 'Birthday',
          wedding: 'Wedding',
          party: 'Party',
          date: 'Date',
          professional: 'Professional',
          casual: 'Casual',
          vacation: 'Vacation',
          festival: 'Festival',
        },
      },
    },
    isActive: true,
    order: 2,
  },

  // 3. Mood
  {
    multiSelect: true,
    category: 'mood' as const,
    optionKeys: ['happy', 'confident', 'mysterious', 'playful', 'romantic', 'energetic', 'relaxed', 'sexy', 'powerful'],
    translations: {
      es: {
        label: '¿Qué mood buscas en tus fotos?',
        options: {
          happy: 'Feliz',
          confident: 'Confiado',
          mysterious: 'Misterioso',
          playful: 'Juguetón',
          romantic: 'Romántico',
          energetic: 'Energético',
          relaxed: 'Relajado',
          sexy: 'Sexy',
          powerful: 'Poderoso',
        },
      },
      en: {
        label: 'What mood are you looking for in your photos?',
        options: {
          happy: 'Happy',
          confident: 'Confident',
          mysterious: 'Mysterious',
          playful: 'Playful',
          romantic: 'Romantic',
          energetic: 'Energetic',
          relaxed: 'Relaxed',
          sexy: 'Sexy',
          powerful: 'Powerful',
        },
      },
    },
    isActive: true,
    order: 3,
  },

  // 4. Estilos
  {
    multiSelect: true,
    category: 'style' as const,
    optionKeys: ['elegant', 'casual', 'edgy', 'vintage', 'modern', 'professional', 'party', 'romantic', 'streetwear', 'luxury'],
    translations: {
      es: {
        label: '¿Qué estilos te gustan más?',
        options: {
          elegant: 'Elegante',
          casual: 'Casual',
          edgy: 'Atrevido',
          vintage: 'Vintage',
          modern: 'Moderno',
          professional: 'Profesional',
          party: 'Fiesta',
          romantic: 'Romántico',
          streetwear: 'Urbano',
          luxury: 'Lujoso',
        },
      },
      en: {
        label: 'What styles do you like most?',
        options: {
          elegant: 'Elegant',
          casual: 'Casual',
          edgy: 'Edgy',
          vintage: 'Vintage',
          modern: 'Modern',
          professional: 'Professional',
          party: 'Party',
          romantic: 'Romantic',
          streetwear: 'Streetwear',
          luxury: 'Luxury',
        },
      },
    },
    isActive: true,
    order: 4,
  },

  // 5. Paleta de colores
  {
    multiSelect: true,
    category: 'style' as const,
    optionKeys: ['warm', 'cool', 'neutral', 'vibrant', 'pastel', 'dark', 'bright', 'monochrome'],
    translations: {
      es: {
        label: '¿Qué paletas de colores prefieres?',
        options: {
          warm: 'Cálidos',
          cool: 'Fríos',
          neutral: 'Neutros',
          vibrant: 'Vibrantes',
          pastel: 'Pastel',
          dark: 'Oscuros',
          bright: 'Brillantes',
          monochrome: 'Monocromáticos',
        },
      },
      en: {
        label: 'What color palettes do you prefer?',
        options: {
          warm: 'Warm',
          cool: 'Cool',
          neutral: 'Neutral',
          vibrant: 'Vibrant',
          pastel: 'Pastel',
          dark: 'Dark',
          bright: 'Bright',
          monochrome: 'Monochrome',
        },
      },
    },
    isActive: true,
    order: 5,
  },

  // 6. Tipo de encuadre
  {
    multiSelect: true,
    category: 'preferences' as const,
    optionKeys: ['close-up', 'portrait', 'medium', 'full-body', 'group'],
    translations: {
      es: {
        label: '¿Qué tipo de encuadre prefieres?',
        options: {
          'close-up': 'Primer Plano',
          portrait: 'Retrato',
          medium: 'Plano Medio',
          'full-body': 'Cuerpo Completo',
          group: 'Grupo',
        },
      },
      en: {
        label: 'What type of framing do you prefer?',
        options: {
          'close-up': 'Close-up',
          portrait: 'Portrait',
          medium: 'Medium Shot',
          'full-body': 'Full Body',
          group: 'Group',
        },
      },
    },
    isActive: true,
    order: 6,
  },

  // 7. Tipo de iluminación
  {
    multiSelect: true,
    category: 'preferences' as const,
    optionKeys: ['natural', 'studio', 'dramatic', 'soft', 'neon', 'golden-hour', 'sunset', 'backlit'],
    translations: {
      es: {
        label: '¿Qué tipo de iluminación prefieres?',
        options: {
          natural: 'Natural',
          studio: 'Estudio',
          dramatic: 'Dramática',
          soft: 'Suave',
          neon: 'Neón',
          'golden-hour': 'Hora Dorada',
          sunset: 'Atardecer',
          backlit: 'Contraluz',
        },
      },
      en: {
        label: 'What type of lighting do you prefer?',
        options: {
          natural: 'Natural',
          studio: 'Studio',
          dramatic: 'Dramatic',
          soft: 'Soft',
          neon: 'Neon',
          'golden-hour': 'Golden Hour',
          sunset: 'Sunset',
          backlit: 'Backlit',
        },
      },
    },
    isActive: true,
    order: 7,
  },

  // 8. Ambientes/Escenarios
  {
    multiSelect: true,
    category: 'occasions' as const,
    optionKeys: ['indoor', 'outdoor', 'studio', 'beach', 'city', 'nature', 'urban', 'luxury-venue', 'home', 'club'],
    translations: {
      es: {
        label: '¿En qué ambientes te gustaría aparecer?',
        options: {
          indoor: 'Interior',
          outdoor: 'Exterior',
          studio: 'Estudio',
          beach: 'Playa',
          city: 'Ciudad',
          nature: 'Naturaleza',
          urban: 'Urbano',
          'luxury-venue': 'Lugar Lujoso',
          home: 'Casa',
          club: 'Discoteca',
        },
      },
      en: {
        label: 'In what settings would you like to appear?',
        options: {
          indoor: 'Indoor',
          outdoor: 'Outdoor',
          studio: 'Studio',
          beach: 'Beach',
          city: 'City',
          nature: 'Nature',
          urban: 'Urban',
          'luxury-venue': 'Luxury Venue',
          home: 'Home',
          club: 'Club',
        },
      },
    },
    isActive: true,
    order: 8,
  },

  // 9. Temporada/Época del año
  {
    multiSelect: true,
    category: 'occasions' as const,
    optionKeys: ['spring', 'summer', 'autumn', 'winter', 'christmas', 'halloween', 'valentines'],
    translations: {
      es: {
        label: '¿Qué temporadas o festividades te interesan?',
        options: {
          spring: 'Primavera',
          summer: 'Verano',
          autumn: 'Otoño',
          winter: 'Invierno',
          christmas: 'Navidad',
          halloween: 'Halloween',
          valentines: 'San Valentín',
        },
      },
      en: {
        label: 'What seasons or holidays interest you?',
        options: {
          spring: 'Spring',
          summer: 'Summer',
          autumn: 'Autumn',
          winter: 'Winter',
          christmas: 'Christmas',
          halloween: 'Halloween',
          valentines: 'Valentine\'s',
        },
      },
    },
    isActive: true,
    order: 9,
  },

  // 10. Tipo de vestimenta
  {
    multiSelect: true,
    category: 'style' as const,
    optionKeys: ['formal', 'semiformal', 'casual', 'sportswear', 'swimwear', 'evening-wear', 'bohemian', 'preppy'],
    translations: {
      es: {
        label: '¿Qué tipo de vestimenta prefieres?',
        options: {
          formal: 'Formal',
          semiformal: 'Semi-formal',
          casual: 'Casual',
          sportswear: 'Deportiva',
          swimwear: 'Traje de Baño',
          'evening-wear': 'Vestimenta de Noche',
          bohemian: 'Bohemio',
          preppy: 'Preppy',
        },
      },
      en: {
        label: 'What type of clothing do you prefer?',
        options: {
          formal: 'Formal',
          semiformal: 'Semi-formal',
          casual: 'Casual',
          sportswear: 'Sportswear',
          swimwear: 'Swimwear',
          'evening-wear': 'Evening Wear',
          bohemian: 'Bohemian',
          preppy: 'Preppy',
        },
      },
    },
    isActive: true,
    order: 10,
  },

  // 11. Accesorios
  {
    multiSelect: true,
    category: 'style' as const,
    optionKeys: ['sunglasses', 'jewelry', 'hats', 'watches', 'bags', 'scarves', 'minimal', 'statement'],
    translations: {
      es: {
        label: '¿Qué accesorios te gustan?',
        options: {
          sunglasses: 'Gafas de Sol',
          jewelry: 'Joyería',
          hats: 'Sombreros/Gorras',
          watches: 'Relojes',
          bags: 'Bolsos',
          scarves: 'Bufandas',
          minimal: 'Minimalista',
          statement: 'Llamativos',
        },
      },
      en: {
        label: 'What accessories do you like?',
        options: {
          sunglasses: 'Sunglasses',
          jewelry: 'Jewelry',
          hats: 'Hats',
          watches: 'Watches',
          bags: 'Bags',
          scarves: 'Scarves',
          minimal: 'Minimal',
          statement: 'Statement',
        },
      },
    },
    isActive: true,
    order: 11,
  },

  // 12. Expresiones faciales
  {
    multiSelect: true,
    category: 'mood' as const,
    optionKeys: ['smiling', 'laughing', 'serious', 'flirty', 'intense', 'candid', 'sultry', 'joyful'],
    translations: {
      es: {
        label: '¿Qué expresiones faciales prefieres?',
        options: {
          smiling: 'Sonriendo',
          laughing: 'Riendo',
          serious: 'Serio',
          flirty: 'Coqueto',
          intense: 'Intenso',
          candid: 'Natural',
          sultry: 'Sensual',
          joyful: 'Alegre',
        },
      },
      en: {
        label: 'What facial expressions do you prefer?',
        options: {
          smiling: 'Smiling',
          laughing: 'Laughing',
          serious: 'Serious',
          flirty: 'Flirty',
          intense: 'Intense',
          candid: 'Candid',
          sultry: 'Sultry',
          joyful: 'Joyful',
        },
      },
    },
    isActive: true,
    order: 12,
  },

  // 13. Hora del día
  {
    multiSelect: true,
    category: 'preferences' as const,
    optionKeys: ['morning', 'midday', 'afternoon', 'evening', 'night', 'dawn', 'dusk'],
    translations: {
      es: {
        label: '¿En qué momento del día prefieres las fotos?',
        options: {
          morning: 'Mañana',
          midday: 'Mediodía',
          afternoon: 'Tarde',
          evening: 'Atardecer',
          night: 'Noche',
          dawn: 'Amanecer',
          dusk: 'Crepúsculo',
        },
      },
      en: {
        label: 'What time of day do you prefer for photos?',
        options: {
          morning: 'Morning',
          midday: 'Midday',
          afternoon: 'Afternoon',
          evening: 'Evening',
          night: 'Night',
          dawn: 'Dawn',
          dusk: 'Dusk',
        },
      },
    },
    isActive: true,
    order: 13,
  },

  // 14. Actividades
  {
    multiSelect: true,
    category: 'occasions' as const,
    optionKeys: ['sports', 'dancing', 'working', 'traveling', 'dining', 'shopping', 'exercising', 'socializing'],
    translations: {
      es: {
        label: '¿En qué actividades te gustaría aparecer?',
        options: {
          sports: 'Deportes',
          dancing: 'Bailando',
          working: 'Trabajando',
          traveling: 'Viajando',
          dining: 'Cenando',
          shopping: 'Comprando',
          exercising: 'Ejercitándote',
          socializing: 'Socializando',
        },
      },
      en: {
        label: 'In what activities would you like to appear?',
        options: {
          sports: 'Sports',
          dancing: 'Dancing',
          working: 'Working',
          traveling: 'Traveling',
          dining: 'Dining',
          shopping: 'Shopping',
          exercising: 'Exercising',
          socializing: 'Socializing',
        },
      },
    },
    isActive: true,
    order: 14,
  },

  // 15. Nivel de formalidad
  {
    multiSelect: true,
    category: 'style' as const,
    optionKeys: ['very-formal', 'business', 'smart-casual', 'casual-chic', 'relaxed', 'sporty'],
    translations: {
      es: {
        label: '¿Qué nivel de formalidad prefieres?',
        options: {
          'very-formal': 'Muy Formal',
          business: 'Negocios',
          'smart-casual': 'Smart Casual',
          'casual-chic': 'Casual Elegante',
          relaxed: 'Relajado',
          sporty: 'Deportivo',
        },
      },
      en: {
        label: 'What level of formality do you prefer?',
        options: {
          'very-formal': 'Very Formal',
          business: 'Business',
          'smart-casual': 'Smart Casual',
          'casual-chic': 'Casual Chic',
          relaxed: 'Relaxed',
          sporty: 'Sporty',
        },
      },
    },
    isActive: true,
    order: 15,
  },

  // 16. Poses
  {
    multiSelect: true,
    category: 'preferences' as const,
    optionKeys: ['standing', 'sitting', 'lying', 'walking', 'action', 'posed', 'candid', 'dynamic'],
    translations: {
      es: {
        label: '¿Qué tipo de poses prefieres?',
        options: {
          standing: 'De Pie',
          sitting: 'Sentado',
          lying: 'Recostado',
          walking: 'Caminando',
          action: 'En Acción',
          posed: 'Posado',
          candid: 'Natural',
          dynamic: 'Dinámico',
        },
      },
      en: {
        label: 'What type of poses do you prefer?',
        options: {
          standing: 'Standing',
          sitting: 'Sitting',
          lying: 'Lying',
          walking: 'Walking',
          action: 'Action',
          posed: 'Posed',
          candid: 'Candid',
          dynamic: 'Dynamic',
        },
      },
    },
    isActive: true,
    order: 16,
  },

  // 17. Tipo de fondo
  {
    multiSelect: true,
    category: 'preferences' as const,
    optionKeys: ['plain', 'textured', 'scenic', 'blurred', 'architectural', 'nature', 'urban', 'abstract'],
    translations: {
      es: {
        label: '¿Qué tipo de fondo prefieres?',
        options: {
          plain: 'Liso',
          textured: 'Con Textura',
          scenic: 'Paisajístico',
          blurred: 'Difuminado',
          architectural: 'Arquitectónico',
          nature: 'Naturaleza',
          urban: 'Urbano',
          abstract: 'Abstracto',
        },
      },
      en: {
        label: 'What type of background do you prefer?',
        options: {
          plain: 'Plain',
          textured: 'Textured',
          scenic: 'Scenic',
          blurred: 'Blurred',
          architectural: 'Architectural',
          nature: 'Nature',
          urban: 'Urban',
          abstract: 'Abstract',
        },
      },
    },
    isActive: true,
    order: 17,
  },

  // 18. Estética de foto
  {
    multiSelect: true,
    category: 'style' as const,
    optionKeys: ['cinematic', 'minimalist', 'maximalist', 'retro', 'futuristic', 'artistic', 'commercial', 'editorial'],
    translations: {
      es: {
        label: '¿Qué estética fotográfica prefieres?',
        options: {
          cinematic: 'Cinematográfica',
          minimalist: 'Minimalista',
          maximalist: 'Maximalista',
          retro: 'Retro',
          futuristic: 'Futurista',
          artistic: 'Artística',
          commercial: 'Comercial',
          editorial: 'Editorial',
        },
      },
      en: {
        label: 'What photo aesthetic do you prefer?',
        options: {
          cinematic: 'Cinematic',
          minimalist: 'Minimalist',
          maximalist: 'Maximalist',
          retro: 'Retro',
          futuristic: 'Futuristic',
          artistic: 'Artistic',
          commercial: 'Commercial',
          editorial: 'Editorial',
        },
      },
    },
    isActive: true,
    order: 18,
  },

  // 19. Tema cultural
  {
    multiSelect: true,
    category: 'style' as const,
    optionKeys: ['western', 'asian', 'latin', 'african', 'middle-eastern', 'european', 'tropical', 'multicultural'],
    translations: {
      es: {
        label: '¿Qué temas culturales te interesan?',
        options: {
          western: 'Occidental',
          asian: 'Asiático',
          latin: 'Latino',
          african: 'Africano',
          'middle-eastern': 'Medio Oriente',
          european: 'Europeo',
          tropical: 'Tropical',
          multicultural: 'Multicultural',
        },
      },
      en: {
        label: 'What cultural themes interest you?',
        options: {
          western: 'Western',
          asian: 'Asian',
          latin: 'Latin',
          african: 'African',
          'middle-eastern': 'Middle Eastern',
          european: 'European',
          tropical: 'Tropical',
          multicultural: 'Multicultural',
        },
      },
    },
    isActive: true,
    order: 19,
  },

  // 20. Interacción en la foto
  {
    multiSelect: true,
    category: 'mood' as const,
    optionKeys: ['solo', 'with-partner', 'with-friends', 'with-pets', 'with-objects', 'interactive'],
    translations: {
      es: {
        label: '¿Cómo prefieres que sea la interacción en la foto?',
        options: {
          solo: 'Solo',
          'with-partner': 'Con Pareja',
          'with-friends': 'Con Amigos',
          'with-pets': 'Con Mascotas',
          'with-objects': 'Con Objetos',
          interactive: 'Interactivo',
        },
      },
      en: {
        label: 'How do you prefer the interaction in the photo?',
        options: {
          solo: 'Solo',
          'with-partner': 'With Partner',
          'with-friends': 'With Friends',
          'with-pets': 'With Pets',
          'with-objects': 'With Objects',
          interactive: 'Interactive',
        },
      },
    },
    isActive: true,
    order: 20,
  },

  // 21. Tipo de cabello
  {
    multiSelect: true,
    category: 'preferences' as const,
    optionKeys: ['short', 'medium', 'long', 'curly', 'straight', 'wavy', 'bald', 'updo'],
    translations: {
      es: {
        label: '¿Qué tipo de cabello prefieres?',
        options: {
          short: 'Corto',
          medium: 'Mediano',
          long: 'Largo',
          curly: 'Rizado',
          straight: 'Lacio',
          wavy: 'Ondulado',
          bald: 'Calvo/Rapado',
          updo: 'Recogido',
        },
      },
      en: {
        label: 'What type of hair do you prefer?',
        options: {
          short: 'Short',
          medium: 'Medium',
          long: 'Long',
          curly: 'Curly',
          straight: 'Straight',
          wavy: 'Wavy',
          bald: 'Bald/Shaved',
          updo: 'Updo',
        },
      },
    },
    isActive: true,
    order: 21,
  },

  // 22. Color de cabello
  {
    multiSelect: true,
    category: 'preferences' as const,
    optionKeys: ['black', 'brown', 'blonde', 'red', 'gray', 'colorful', 'natural', 'highlights'],
    translations: {
      es: {
        label: '¿Qué color de cabello prefieres?',
        options: {
          black: 'Negro',
          brown: 'Castaño',
          blonde: 'Rubio',
          red: 'Pelirrojo',
          gray: 'Gris/Plateado',
          colorful: 'Colorido',
          natural: 'Natural',
          highlights: 'Con Reflejos',
        },
      },
      en: {
        label: 'What hair color do you prefer?',
        options: {
          black: 'Black',
          brown: 'Brown',
          blonde: 'Blonde',
          red: 'Red',
          gray: 'Gray/Silver',
          colorful: 'Colorful',
          natural: 'Natural',
          highlights: 'With Highlights',
        },
      },
    },
    isActive: true,
    order: 22,
  },

  // 23. Nivel de maquillaje
  {
    multiSelect: true,
    category: 'style' as const,
    optionKeys: ['natural', 'light', 'moderate', 'glamorous', 'artistic', 'none', 'bold'],
    translations: {
      es: {
        label: '¿Qué nivel de maquillaje prefieres?',
        options: {
          natural: 'Natural',
          light: 'Ligero',
          moderate: 'Moderado',
          glamorous: 'Glamuroso',
          artistic: 'Artístico',
          none: 'Sin Maquillaje',
          bold: 'Atrevido',
        },
      },
      en: {
        label: 'What makeup level do you prefer?',
        options: {
          natural: 'Natural',
          light: 'Light',
          moderate: 'Moderate',
          glamorous: 'Glamorous',
          artistic: 'Artistic',
          none: 'No Makeup',
          bold: 'Bold',
        },
      },
    },
    isActive: true,
    order: 23,
  },

  // 24. Ángulo de cámara
  {
    multiSelect: true,
    category: 'preferences' as const,
    optionKeys: ['eye-level', 'high-angle', 'low-angle', 'birds-eye', 'dutch-tilt', 'over-shoulder'],
    translations: {
      es: {
        label: '¿Qué ángulo de cámara prefieres?',
        options: {
          'eye-level': 'A la Altura de los Ojos',
          'high-angle': 'Ángulo Alto',
          'low-angle': 'Ángulo Bajo',
          'birds-eye': 'Vista de Pájaro',
          'dutch-tilt': 'Inclinado',
          'over-shoulder': 'Sobre el Hombro',
        },
      },
      en: {
        label: 'What camera angle do you prefer?',
        options: {
          'eye-level': 'Eye Level',
          'high-angle': 'High Angle',
          'low-angle': 'Low Angle',
          'birds-eye': 'Bird\'s Eye',
          'dutch-tilt': 'Dutch Tilt',
          'over-shoulder': 'Over Shoulder',
        },
      },
    },
    isActive: true,
    order: 24,
  },

  // 25. Intensidad de edición
  {
    multiSelect: true,
    category: 'style' as const,
    optionKeys: ['minimal', 'subtle', 'moderate', 'heavy', 'artistic', 'natural', 'filtered'],
    translations: {
      es: {
        label: '¿Qué intensidad de edición prefieres?',
        options: {
          minimal: 'Mínima',
          subtle: 'Sutil',
          moderate: 'Moderada',
          heavy: 'Intensa',
          artistic: 'Artística',
          natural: 'Natural',
          filtered: 'Con Filtros',
        },
      },
      en: {
        label: 'What editing intensity do you prefer?',
        options: {
          minimal: 'Minimal',
          subtle: 'Subtle',
          moderate: 'Moderate',
          heavy: 'Heavy',
          artistic: 'Artistic',
          natural: 'Natural',
          filtered: 'Filtered',
        },
      },
    },
    isActive: true,
    order: 25,
  },

  // 26. Locaciones específicas
  {
    multiSelect: true,
    category: 'occasions' as const,
    optionKeys: ['rooftop', 'restaurant', 'gym', 'cafe', 'park', 'museum', 'street', 'pool'],
    translations: {
      es: {
        label: '¿En qué locaciones específicas te gustaría aparecer?',
        options: {
          rooftop: 'Azotea',
          restaurant: 'Restaurante',
          gym: 'Gimnasio',
          cafe: 'Café',
          park: 'Parque',
          museum: 'Museo',
          street: 'Calle',
          pool: 'Piscina',
        },
      },
      en: {
        label: 'In what specific locations would you like to appear?',
        options: {
          rooftop: 'Rooftop',
          restaurant: 'Restaurant',
          gym: 'Gym',
          cafe: 'Cafe',
          park: 'Park',
          museum: 'Museum',
          street: 'Street',
          pool: 'Pool',
        },
      },
    },
    isActive: true,
    order: 26,
  },

  // 27. Tipo de mirada
  {
    multiSelect: true,
    category: 'mood' as const,
    optionKeys: ['direct', 'away', 'down', 'up', 'side', 'closed-eyes', 'seductive', 'playful'],
    translations: {
      es: {
        label: '¿Qué tipo de mirada prefieres?',
        options: {
          direct: 'Directa a Cámara',
          away: 'Hacia Otro Lado',
          down: 'Hacia Abajo',
          up: 'Hacia Arriba',
          side: 'De Lado',
          'closed-eyes': 'Ojos Cerrados',
          seductive: 'Seductora',
          playful: 'Juguetona',
        },
      },
      en: {
        label: 'What type of gaze do you prefer?',
        options: {
          direct: 'Direct at Camera',
          away: 'Looking Away',
          down: 'Looking Down',
          up: 'Looking Up',
          side: 'Side Glance',
          'closed-eyes': 'Closed Eyes',
          seductive: 'Seductive',
          playful: 'Playful',
        },
      },
    },
    isActive: true,
    order: 27,
  },

  // 28. Clima/Condiciones
  {
    multiSelect: true,
    category: 'preferences' as const,
    optionKeys: ['sunny', 'cloudy', 'rainy', 'snowy', 'foggy', 'windy', 'golden-hour', 'blue-hour'],
    translations: {
      es: {
        label: '¿Qué clima o condiciones prefieres?',
        options: {
          sunny: 'Soleado',
          cloudy: 'Nublado',
          rainy: 'Lluvioso',
          snowy: 'Nevado',
          foggy: 'Neblinoso',
          windy: 'Ventoso',
          'golden-hour': 'Hora Dorada',
          'blue-hour': 'Hora Azul',
        },
      },
      en: {
        label: 'What weather or conditions do you prefer?',
        options: {
          sunny: 'Sunny',
          cloudy: 'Cloudy',
          rainy: 'Rainy',
          snowy: 'Snowy',
          foggy: 'Foggy',
          windy: 'Windy',
          'golden-hour': 'Golden Hour',
          'blue-hour': 'Blue Hour',
        },
      },
    },
    isActive: true,
    order: 28,
  },

  // 29. Props/Objetos
  {
    multiSelect: true,
    category: 'style' as const,
    optionKeys: ['phone', 'drink', 'flowers', 'book', 'instrument', 'car', 'sports-equipment', 'food'],
    translations: {
      es: {
        label: '¿Con qué objetos o props te gustaría aparecer?',
        options: {
          phone: 'Teléfono',
          drink: 'Bebida',
          flowers: 'Flores',
          book: 'Libro',
          instrument: 'Instrumento Musical',
          car: 'Auto',
          'sports-equipment': 'Equipo Deportivo',
          food: 'Comida',
        },
      },
      en: {
        label: 'What objects or props would you like to appear with?',
        options: {
          phone: 'Phone',
          drink: 'Drink',
          flowers: 'Flowers',
          book: 'Book',
          instrument: 'Musical Instrument',
          car: 'Car',
          'sports-equipment': 'Sports Equipment',
          food: 'Food',
        },
      },
    },
    isActive: true,
    order: 29,
  },

  // 30. Tatuajes/Piercings
  {
    multiSelect: true,
    category: 'style' as const,
    optionKeys: ['visible-tattoos', 'hidden-tattoos', 'no-tattoos', 'piercings', 'no-piercings', 'body-art'],
    translations: {
      es: {
        label: '¿Qué prefieres respecto a tatuajes y piercings?',
        options: {
          'visible-tattoos': 'Tatuajes Visibles',
          'hidden-tattoos': 'Tatuajes Ocultos',
          'no-tattoos': 'Sin Tatuajes',
          piercings: 'Con Piercings',
          'no-piercings': 'Sin Piercings',
          'body-art': 'Arte Corporal',
        },
      },
      en: {
        label: 'What do you prefer regarding tattoos and piercings?',
        options: {
          'visible-tattoos': 'Visible Tattoos',
          'hidden-tattoos': 'Hidden Tattoos',
          'no-tattoos': 'No Tattoos',
          piercings: 'With Piercings',
          'no-piercings': 'No Piercings',
          'body-art': 'Body Art',
        },
      },
    },
    isActive: true,
    order: 30,
  },

  // 31. Nivel de glamour
  {
    multiSelect: true,
    category: 'style' as const,
    optionKeys: ['high-fashion', 'casual-elegant', 'street-style', 'understated', 'extravagant', 'minimalist', 'maximalist'],
    translations: {
      es: {
        label: '¿Qué nivel de glamour prefieres?',
        options: {
          'high-fashion': 'Alta Moda',
          'casual-elegant': 'Casual Elegante',
          'street-style': 'Estilo Urbano',
          understated: 'Discreto',
          extravagant: 'Extravagante',
          minimalist: 'Minimalista',
          maximalist: 'Maximalista',
        },
      },
      en: {
        label: 'What level of glamour do you prefer?',
        options: {
          'high-fashion': 'High Fashion',
          'casual-elegant': 'Casual Elegant',
          'street-style': 'Street Style',
          understated: 'Understated',
          extravagant: 'Extravagant',
          minimalist: 'Minimalist',
          maximalist: 'Maximalist',
        },
      },
    },
    isActive: true,
    order: 31,
  },

  // 32. Música/Género
  {
    multiSelect: true,
    category: 'mood' as const,
    optionKeys: ['rock', 'pop', 'hip-hop', 'electronic', 'classical', 'jazz', 'reggaeton', 'indie'],
    translations: {
      es: {
        label: '¿Qué géneros musicales te representan?',
        options: {
          rock: 'Rock',
          pop: 'Pop',
          'hip-hop': 'Hip-Hop',
          electronic: 'Electrónica',
          classical: 'Clásica',
          jazz: 'Jazz',
          reggaeton: 'Reggaeton',
          indie: 'Indie',
        },
      },
      en: {
        label: 'What music genres represent you?',
        options: {
          rock: 'Rock',
          pop: 'Pop',
          'hip-hop': 'Hip-Hop',
          electronic: 'Electronic',
          classical: 'Classical',
          jazz: 'Jazz',
          reggaeton: 'Reggaeton',
          indie: 'Indie',
        },
      },
    },
    isActive: true,
    order: 32,
  },

  // 33. Contexto social
  {
    multiSelect: true,
    category: 'occasions' as const,
    optionKeys: ['networking', 'dating', 'family', 'friends', 'solo-adventure', 'celebration', 'work-event'],
    translations: {
      es: {
        label: '¿En qué contexto social usarías las fotos?',
        options: {
          networking: 'Networking',
          dating: 'Citas',
          family: 'Familia',
          friends: 'Amigos',
          'solo-adventure': 'Aventura Solitaria',
          celebration: 'Celebración',
          'work-event': 'Evento Laboral',
        },
      },
      en: {
        label: 'In what social context would you use the photos?',
        options: {
          networking: 'Networking',
          dating: 'Dating',
          family: 'Family',
          friends: 'Friends',
          'solo-adventure': 'Solo Adventure',
          celebration: 'Celebration',
          'work-event': 'Work Event',
        },
      },
    },
    isActive: true,
    order: 33,
  },

  // 34. Edad aparente
  {
    multiSelect: true,
    category: 'preferences' as const,
    optionKeys: ['youthful', 'mature', 'ageless', 'my-age', 'younger', 'older'],
    translations: {
      es: {
        label: '¿Qué edad aparente prefieres en las fotos?',
        options: {
          youthful: 'Juvenil',
          mature: 'Maduro',
          ageless: 'Sin Edad Definida',
          'my-age': 'Mi Edad Real',
          younger: 'Más Joven',
          older: 'Más Mayor',
        },
      },
      en: {
        label: 'What apparent age do you prefer in photos?',
        options: {
          youthful: 'Youthful',
          mature: 'Mature',
          ageless: 'Ageless',
          'my-age': 'My Actual Age',
          younger: 'Younger',
          older: 'Older',
        },
      },
    },
    isActive: true,
    order: 34,
  },

  // 35. Énfasis en la foto
  {
    multiSelect: true,
    category: 'preferences' as const,
    optionKeys: ['face', 'eyes', 'smile', 'outfit', 'location', 'mood', 'composition', 'overall'],
    translations: {
      es: {
        label: '¿En qué quieres que se enfoque la foto?',
        options: {
          face: 'Rostro',
          eyes: 'Ojos',
          smile: 'Sonrisa',
          outfit: 'Vestimenta',
          location: 'Locación',
          mood: 'Ambiente/Mood',
          composition: 'Composición',
          overall: 'Conjunto General',
        },
      },
      en: {
        label: 'What do you want the photo to focus on?',
        options: {
          face: 'Face',
          eyes: 'Eyes',
          smile: 'Smile',
          outfit: 'Outfit',
          location: 'Location',
          mood: 'Mood',
          composition: 'Composition',
          overall: 'Overall Look',
        },
      },
    },
    isActive: true,
    order: 35,
  },
];

async function resetScreenerQuestions() {
  try {
    console.log('🗑️  Resetting screener questions...');

    const db = getAdminFirestore();
    const questionsRef = db.collection('screenerQuestions');

    // 1. ELIMINAR todas las preguntas existentes
    console.log('📋 Fetching existing questions...');
    const existingSnapshot = await questionsRef.get();

    if (!existingSnapshot.empty) {
      console.log(`🗑️  Deleting ${existingSnapshot.size} existing questions...`);

      const batch = db.batch();
      existingSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log('✅ Old questions deleted successfully');
    } else {
      console.log('ℹ️  No existing questions to delete');
    }

    // 2. CREAR las nuevas preguntas con el formato correcto
    console.log('\n🌱 Creating new questions with translations...');
    const createBatch = db.batch();

    for (const question of INITIAL_QUESTIONS) {
      const docRef = questionsRef.doc(); // Auto-generate ID
      createBatch.set(docRef, {
        ...question,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
      });
      console.log(`✅ Added question: ${question.translations.es.label}`);
    }

    await createBatch.commit();

    console.log('');
    console.log('✨ Successfully reset screener questions!');
    console.log(`📊 Created ${INITIAL_QUESTIONS.length} questions with new format`);
    console.log('');
    console.log('🎉 Done! Questions now have dynamic translations stored in Firebase');
    console.log('💡 Visit /admin/screener-questions to manage them');

  } catch (error: any) {
    console.error('❌ Error resetting screener questions:', error.message);
    process.exit(1);
  }
}

// Run the reset script
resetScreenerQuestions()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
