'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import {
  Heart, Grid as GridIcon, RefreshCw, ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/auth/AuthProvider';
import { AppHeader } from '@/app/components/AppHeader';
import { MobileMenu } from '@/app/components/MobileMenu';
import { ShareModal } from '@/app/components/modals/ShareModal';
import { ImagePreviewModal } from '@/app/components/modals/ImagePreviewModal';


interface GalleryItem {
  id: string;
  imageUrl: string;
  thumbnailUrl?: string;
  displayName: string;
  caption?: string;
  likes: number;
  views: number;
  isFeatured?: boolean;
  publishedAt: string;
  templateTitle?: string;
  style?: string;
}

export default function PublicGalleryPage() {
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
  const { user, loading: authLoading, signInWithGoogle, signOutUser, getUserIdToken } = useAuth();

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());

  // Estados de UI
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Estados de créditos
  const [userCredits, setUserCredits] = useState(0);
  const [loadingCredits, setLoadingCredits] = useState(true);

  // Estados de Guest Mode
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [previewItem, setPreviewItem] = useState<GalleryItem | null>(null);

  const ITEMS_PER_PAGE = 20;

  // Load liked items from localStorage on mount
  useEffect(() => {
    const savedLikes = localStorage.getItem('gallery_liked_items');
    if (savedLikes) {
      try {
        const parsed = JSON.parse(savedLikes);
        setLikedItems(new Set(parsed));
      } catch (error) {
        console.error('Error loading liked items:', error);
      }
    }
  }, []);

  useEffect(() => {
    loadGallery(true); // Load on mount
  }, []);

  // Cargar créditos al autenticarse
  useEffect(() => {
    if (authLoading) return;
    if (user) {
      loadUserCredits();
      setIsGuestMode(false);
    } else {
      setIsGuestMode(true);
      setLoadingCredits(false);
    }
  }, [user, authLoading]);

  const loadUserCredits = async () => {
    try {
      const token = await getUserIdToken();
      if (!token) return;

      const response = await fetch('/api/credits/balance', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUserCredits(data.credits || 0);
      }
    } catch (error) {
      console.error('Error cargando créditos:', error);
    } finally {
      setLoadingCredits(false);
    }
  };

  const loadGallery = async (reset = false) => {
    setLoading(true);

    try {
      const currentOffset = reset ? 0 : offset;

      // Sin filtros - solo cargar las más recientes
      const response = await fetch(
        `/api/gallery/public?sortBy=recent&limit=${ITEMS_PER_PAGE}&offset=${currentOffset}`
      );

      if (!response.ok) {
        throw new Error('Failed to load gallery');
      }

      const data = await response.json();

      if (reset) {
        setItems(data.items);
        setOffset(ITEMS_PER_PAGE);
      } else {
        setItems(prev => [...prev, ...data.items]);
        setOffset(prev => prev + ITEMS_PER_PAGE);
      }

      setHasMore(data.pagination.hasMore);

    } catch (error) {
      console.error('Error loading gallery:', error);
      toast.error(t('gallery.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (itemId: string) => {
    const currentlyLiked = likedItems.has(itemId);

    try {
      const response = await fetch('/api/gallery/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          galleryItemId: itemId,
          action: currentlyLiked ? 'unlike' : 'like'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to like');
      }

      // Update liked items state
      const newLikedItems = new Set(likedItems);
      if (currentlyLiked) {
        newLikedItems.delete(itemId);
      } else {
        newLikedItems.add(itemId);
      }
      setLikedItems(newLikedItems);

      // Save to localStorage
      localStorage.setItem('gallery_liked_items', JSON.stringify(Array.from(newLikedItems)));

      // Update local items state
      setItems(prev => prev.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            likes: currentlyLiked ? item.likes - 1 : item.likes + 1
          };
        }
        return item;
      }));

    } catch (error) {
      console.error('Error liking item:', error);
      toast.error(t('gallery.likeError'));
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <RefreshCw className="w-12 h-12 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header Compartido */}
      <AppHeader
        isGuestMode={isGuestMode}
        userCredits={userCredits}
        loadingCredits={loadingCredits}
        isSigningIn={isSigningIn}
        onSignIn={async () => {
          setIsSigningIn(true);
          try {
            await signInWithGoogle();
          } catch (error) {
            console.error('Error al iniciar sesión:', error);
          } finally {
            setIsSigningIn(false);
          }
        }}
        onMenuClick={() => setShowMobileMenu(true)}
        onLogoClick={() => router.push(`/${locale}`)}
      />

      {/* Main Content - Mobile Centered */}
      <main className="flex flex-col min-h-screen max-w-md mx-auto pt-14 pb-4 px-4">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 mt-2"
        >
          <ArrowLeft size={20} />
          <span className="text-sm">{t('common.back')}</span>
        </button>

        {/* Gallery Grid */}
        {loading && offset === 0 ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-pink-500" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <GridIcon size={40} className="mx-auto text-gray-600 mb-3" />
            <p className="text-sm text-gray-400">{t('gallery.empty')}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {items.map(item => (
                <div
                  key={item.id}
                  className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 hover:border-pink-500/50 transition-all cursor-pointer"
                  onClick={() => setPreviewItem(item)}
                >
                  {/* Image */}
                  <img
                    src={item.thumbnailUrl || item.imageUrl}
                    alt={item.caption || 'Gallery item'}
                    className="w-full h-full object-cover"
                  />

                  {/* Gradient Overlay - Always visible on mobile */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />

                  {/* Info Overlay - Always visible on mobile */}
                  <div className="absolute bottom-0 left-0 right-0 p-2.5">
                    {item.caption && (
                      <p className="text-[10px] text-gray-300 mb-1.5 line-clamp-2 leading-tight">
                        {item.caption}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400">
                        {item.displayName}
                      </span>

                      <button
                        onClick={(e) => { e.stopPropagation(); handleLike(item.id); }}
                        className={`flex items-center gap-1 text-[10px] transition-colors active:scale-95 ${
                          likedItems.has(item.id)
                            ? 'text-pink-500'
                            : 'text-gray-400'
                        }`}
                      >
                        <Heart
                          size={12}
                          className={likedItems.has(item.id) ? 'fill-pink-500' : ''}
                        />
                        {item.likes}
                      </button>
                    </div>
                  </div>

                  {/* Featured Badge - Mobile Optimized */}
                  {item.isFeatured && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/50">
                      <span className="text-[10px] font-bold text-yellow-300">
                        ⭐ {t('gallery.featured')}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Load More - Mobile Optimized */}
            {hasMore && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => loadGallery(false)}
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-white/5 border border-white/10 font-bold text-sm hover:border-pink-500/50 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{t('common.loading')}</span>
                    </>
                  ) : (
                    t('gallery.loadMore')
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        user={user}
        onSignOut={signOutUser}
        onShareApp={() => {
          setShowMobileMenu(false);
          setShowShareModal(true);
        }}
        currentLocale={locale}
        onChangeLocale={(newLocale) => {
          router.push(`/${newLocale}/gallery`);
        }}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        type="app"
      />

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={!!previewItem}
        onClose={() => setPreviewItem(null)}
        imageUrl={previewItem?.imageUrl || ''}
        title={previewItem?.caption || previewItem?.style}
      />
    </div>
  );
}
