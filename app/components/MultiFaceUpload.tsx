'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Upload, X, Users, Check } from 'lucide-react';
import { toast } from 'sonner';
import { validateImage } from '@/lib/security/image-validator';

interface FaceSlot {
  id: number;
  image: string | null;
  file: File | null;
  label: string;
}

interface MultiFaceUploadProps {
  faceCount: number;
  onImagesSelected: (images: string[]) => void;
  templatePreview?: string;
}

export function MultiFaceUpload({
  faceCount,
  onImagesSelected,
  templatePreview
}: MultiFaceUploadProps) {
  const t = useTranslations();
  const [faceSlots, setFaceSlots] = useState<FaceSlot[]>(
    Array.from({ length: faceCount }, (_, i) => ({
      id: i,
      image: null,
      file: null,
      label: `Person ${i + 1}`
    }))
  );

  const handleFileSelect = async (slotId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('upload.errors.invalidType'));
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('upload.errors.tooLarge'));
      return;
    }

    // Read file as data URL
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageUrl = e.target?.result as string;

      // 🔒 SECURITY: Validate image
      console.log('🔒 Validating image...');
      const validation = await validateImage(imageUrl, {
        maxSizeBytes: 10 * 1024 * 1024,
        maxWidth: 4096,
        maxHeight: 4096,
        stripExif: true,
        checkAspectRatio: true
      });

      if (!validation.valid) {
        console.error('❌ Image validation failed:', validation.errors);
        toast.error(validation.errors[0]);
        return;
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        console.warn('⚠️ Image warnings:', validation.warnings);
      }

      console.log('✅ Image validated');

      // Use sanitized image (EXIF removed)
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

    if (uploadedImages.length !== faceCount) {
      toast.error(t('groupPhotos.errors.notAllUploaded', { count: faceCount }));
      return;
    }

    onImagesSelected(uploadedImages);
  };

  const uploadedCount = faceSlots.filter(slot => slot.image !== null).length;
  const allUploaded = uploadedCount === faceCount;

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
          {t('groupPhotos.subtitle', { count: faceCount })}
        </p>
      </div>

      {/* Template Preview (Optional) */}
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
            {t('groupPhotos.progress', { uploaded: uploadedCount, total: faceCount })}
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
              // Empty slot - upload button
              <label
                htmlFor={`face-upload-${slot.id}`}
                className="flex flex-col items-center justify-center aspect-[3/4] rounded-2xl border-2 border-dashed border-white/20 hover:border-pink-500/50 bg-white/5 cursor-pointer transition-all active:scale-95"
              >
                <Upload size={32} className="text-gray-500 mb-2" />
                <p className="text-sm font-bold text-gray-300">
                  {t('groupPhotos.person', { number: slot.id + 1 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {t('upload.tapToUpload')}
                </p>
              </label>
            ) : (
              // Uploaded slot - show preview
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-pink-500">
                <img
                  src={slot.image}
                  alt={`Person ${slot.id + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Remove button */}
                <button
                  onClick={() => handleRemove(slot.id)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/80 flex items-center justify-center hover:bg-red-600 transition-all active:scale-95"
                  aria-label={t('upload.remove')}
                >
                  <X size={16} className="text-white" />
                </button>

                {/* Label */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-xs font-bold text-center">
                    {t('groupPhotos.person', { number: slot.id + 1 })}
                  </p>
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
