'use client';

import React, { useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Upload, X, Users, Check, User, Baby, Dog } from 'lucide-react';
import { toast } from 'sonner';
import { validateImage } from '@/lib/security/image-validator';
import { TemplateSlot, SlotSubjectType } from '@/types/template';
import { SLOT_TYPE_CONFIGS } from '@/lib/slots/slot-config';

function SlotIcon({ type, ...props }: { type: SlotSubjectType } & React.ComponentProps<typeof User>) {
  switch (type) {
    case 'pet': return <Dog {...props} />;
    case 'baby': return <Baby {...props} />;
    default: return <User {...props} />;
  }
}

interface FaceSlot {
  id: number;
  image: string | null;
  file: File | null;
  label: string;
  slotType: SlotSubjectType;
  color: string;
}

interface MultiFaceUploadProps {
  slots?: TemplateSlot[];
  faceCount?: number;
  onImagesSelected: (images: string[]) => void;
  templatePreview?: string;
}

export function MultiFaceUpload({
  slots,
  faceCount,
  onImagesSelected,
  templatePreview
}: MultiFaceUploadProps) {
  const t = useTranslations();
  const locale = useLocale();

  const effectiveSlots = useMemo<TemplateSlot[]>(() => {
    if (slots && slots.length > 0) return slots;
    const count = faceCount || 2;
    return Array.from({ length: count }, (_, i) => ({
      type: 'person' as SlotSubjectType,
      position: i,
    }));
  }, [slots, faceCount]);

  const [faceSlots, setFaceSlots] = useState<FaceSlot[]>(
    effectiveSlots.map((slot, i) => {
      const config = SLOT_TYPE_CONFIGS[slot.type];
      const lang = (locale === 'es' ? 'es' : 'en') as 'en' | 'es';
      return {
        id: i,
        image: null,
        file: null,
        label: slot.label || config.defaultLabel[lang],
        slotType: slot.type,
        color: config.color,
      };
    })
  );

  const handleFileSelect = async (slotId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(t('upload.errors.invalidType'));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('upload.errors.tooLarge'));
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageUrl = e.target?.result as string;

      const validation = await validateImage(imageUrl, {
        maxSizeBytes: 10 * 1024 * 1024,
        maxWidth: 4096,
        maxHeight: 4096,
        stripExif: true,
        checkAspectRatio: true
      });

      if (!validation.valid) {
        toast.error(validation.errors[0]);
        return;
      }

      const cleanImage = validation.sanitizedImage || imageUrl;

      setFaceSlots(prev => prev.map(slot =>
        slot.id === slotId
          ? { ...slot, image: cleanImage, file }
          : slot
      ));
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = (slotId: number) => {
    setFaceSlots(prev => prev.map(slot =>
      slot.id === slotId
        ? { ...slot, image: null, file: null }
        : slot
    ));
  };

  const handleContinue = () => {
    const uploadedImages = faceSlots
      .filter(slot => slot.image !== null)
      .map(slot => slot.image!);

    if (uploadedImages.length !== effectiveSlots.length) {
      toast.error(t('groupPhotos.errors.notAllUploaded', { count: effectiveSlots.length }));
      return;
    }

    onImagesSelected(uploadedImages);
  };

  const uploadedCount = faceSlots.filter(slot => slot.image !== null).length;
  const allUploaded = uploadedCount === effectiveSlots.length;

  const getSlotHint = (type: SlotSubjectType): string => {
    if (type === 'pet') return t('groupPhotos.slotHint.pet');
    if (type === 'baby') return t('groupPhotos.slotHint.baby');
    return t('groupPhotos.slotHint.default');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Users className="w-6 h-6 text-pink-500" />
          <h2 className="text-2xl font-black italic uppercase">
            {t('groupPhotos.title')}
          </h2>
        </div>
        <p className="text-sm text-gray-400">
          {t('groupPhotos.subtitle', { count: effectiveSlots.length })}
        </p>
      </div>

      {/* Template Preview */}
      {templatePreview && (
        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-white/10">
          <img
            src={templatePreview}
            alt="Template"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <p className="text-xs font-bold text-gray-300">
              {t('groupPhotos.templatePreview')}
            </p>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-pink-500" />
          <span className="text-sm font-bold">
            {t('groupPhotos.progress', { uploaded: uploadedCount, total: effectiveSlots.length })}
          </span>
        </div>
        {allUploaded && (
          <Check size={20} className="text-green-500" />
        )}
      </div>

      {/* Face Upload Slots */}
      <div className="grid grid-cols-2 gap-4">
        {faceSlots.map((slot) => (
          <div key={slot.id} className="relative">
            <input
              type="file"
              id={`face-upload-${slot.id}`}
              accept="image/*"
              onChange={(e) => handleFileSelect(slot.id, e)}
              className="hidden"
            />

            {!slot.image ? (
              <label
                htmlFor={`face-upload-${slot.id}`}
                className="flex flex-col items-center justify-center aspect-[3/4] rounded-2xl border-2 border-dashed border-white/20 hover:border-pink-500/50 bg-white/5 cursor-pointer transition-all active:scale-95"
              >
                <SlotIcon type={slot.slotType} size={32} className={`${slot.color} mb-2`} />
                <p className="text-sm font-bold text-gray-300">
                  {slot.label}
                </p>
                <p className="text-xs text-gray-500 mt-1 text-center px-2">
                  {getSlotHint(slot.slotType)}
                </p>
              </label>
            ) : (
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-pink-500">
                <img
                  src={slot.image}
                  alt={slot.label}
                  className="w-full h-full object-cover"
                />

                <button
                  onClick={() => handleRemove(slot.id)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/80 flex items-center justify-center hover:bg-red-600 transition-all active:scale-95"
                  aria-label={t('upload.remove')}
                >
                  <X size={16} className="text-white" />
                </button>

                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center justify-center gap-1">
                    <SlotIcon type={slot.slotType} size={12} className={slot.color} />
                    <p className="text-xs font-bold text-center">
                      {slot.label}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Continue Button */}
      <button
        onClick={handleContinue}
        disabled={!allUploaded}
        className="w-full h-16 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 font-bold text-lg italic uppercase flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-pink-500/30 transition-all active:scale-95"
      >
        <Check size={24} />
        {t('groupPhotos.continue')}
      </button>

      {/* Help Text */}
      <div className="p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/20">
        <p className="text-xs text-indigo-200/80 text-center">
          {t('groupPhotos.hint')}
        </p>
      </div>
    </div>
  );
}
