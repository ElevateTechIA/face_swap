import { SlotSubjectType } from '@/types/template';

export interface SlotTypeConfig {
  type: SlotSubjectType;
  defaultLabel: { en: string; es: string };
  icon: string;
  color: string;
  uploadHint: { en: string; es: string };
}

export const SLOT_TYPE_CONFIGS: Record<SlotSubjectType, SlotTypeConfig> = {
  person: {
    type: 'person',
    defaultLabel: { en: 'Person', es: 'Persona' },
    icon: 'User',
    color: 'text-pink-500',
    uploadHint: { en: 'Upload a clear face photo', es: 'Sube una foto clara del rostro' },
  },
  woman: {
    type: 'woman',
    defaultLabel: { en: 'Woman', es: 'Mujer' },
    icon: 'User',
    color: 'text-pink-400',
    uploadHint: { en: 'Upload a clear face photo', es: 'Sube una foto clara del rostro' },
  },
  man: {
    type: 'man',
    defaultLabel: { en: 'Man', es: 'Hombre' },
    icon: 'User',
    color: 'text-blue-400',
    uploadHint: { en: 'Upload a clear face photo', es: 'Sube una foto clara del rostro' },
  },
  girl: {
    type: 'girl',
    defaultLabel: { en: 'Girl', es: 'Chica' },
    icon: 'User',
    color: 'text-purple-400',
    uploadHint: { en: 'Upload a clear face photo', es: 'Sube una foto clara del rostro' },
  },
  boy: {
    type: 'boy',
    defaultLabel: { en: 'Boy', es: 'Chico' },
    icon: 'User',
    color: 'text-green-400',
    uploadHint: { en: 'Upload a clear face photo', es: 'Sube una foto clara del rostro' },
  },
  baby: {
    type: 'baby',
    defaultLabel: { en: 'Baby', es: 'Bebe' },
    icon: 'Baby',
    color: 'text-yellow-400',
    uploadHint: { en: 'Upload a clear baby photo', es: 'Sube una foto clara del bebe' },
  },
  pet: {
    type: 'pet',
    defaultLabel: { en: 'Pet', es: 'Mascota' },
    icon: 'Dog',
    color: 'text-orange-400',
    uploadHint: { en: 'Upload a photo of your pet', es: 'Sube una foto de tu mascota' },
  },
};

export const ALL_SLOT_TYPES: SlotSubjectType[] = [
  'person', 'woman', 'man', 'girl', 'boy', 'baby', 'pet',
];
