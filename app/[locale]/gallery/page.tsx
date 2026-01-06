'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  Heart, TrendingUp, Clock, Star, Grid as GridIcon,
  Filter, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';


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

type SortOption = 'recent' | 'trending' | 'popular' | 'featured';

export default function PublicGalleryPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());

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
    loadGallery(true); // Reset on mount or sort change
  }, [sortBy]);

  const loadGallery = async (reset = false) => {
    setLoading(true);

    try {
      const currentOffset = reset ? 0 : offset;

      const response = await fetch(
        `/api/gallery/public?sortBy=${sortBy}&limit=${ITEMS_PER_PAGE}&offset=${currentOffset}`
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

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header - Mobile Only */}
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-14 bg-black/70 backdrop-blur-2xl border-b border-white/10 z-50 flex items-center justify-between px-4">
        <h1 className="text-base font-black italic uppercase tracking-tight">
          {t('gallery.title')}
        </h1>

        <a
          href={`/${locale}`}
          className="px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 font-bold text-xs active:scale-95 transition-all whitespace-nowrap"
        >
          {t('gallery.createYours')}
        </a>
      </header>

      {/* Main Content - Mobile Centered */}
      <main className="flex flex-col min-h-screen max-w-md mx-auto pt-14 pb-4 px-4">
        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
          {[
            { id: 'recent', icon: Clock, label: t('gallery.filters.recent') },
            { id: 'trending', icon: TrendingUp, label: t('gallery.filters.trending') },
            { id: 'popular', icon: Heart, label: t('gallery.filters.popular') },
            { id: 'featured', icon: Star, label: t('gallery.filters.featured') }
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => setSortBy(filter.id as SortOption)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                sortBy === filter.id
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white'
                  : 'bg-white/5 border border-white/10 text-gray-300'
              }`}
            >
              <filter.icon size={14} />
              {filter.label}
            </button>
          ))}
        </div>

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
                  className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 hover:border-pink-500/50 transition-all"
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
                        onClick={() => handleLike(item.id)}
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
    </div>
  );
}
