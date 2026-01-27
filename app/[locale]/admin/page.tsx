'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth/AuthProvider';
import { Plus, Edit2, Trash2, Eye, EyeOff, Loader2, Globe } from 'lucide-react';
import { Template } from '@/types/template';
import { BrandConfig } from '@/types/brand';
import { TemplateForm } from '@/app/components/TemplateForm';
import { BrandConfigForm } from '@/app/components/BrandConfigForm';

export default function AdminPanel() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'templates' | 'brands'>('templates');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [brands, setBrands] = useState<BrandConfig[]>([]);
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('all'); // 'all' or domain
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editingBrand, setEditingBrand] = useState<BrandConfig | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Verificar si el usuario es admin
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/');
      return;
    }

    // Verificar privilegios de admin llamando al endpoint
    checkAdminStatus();
  }, [user, authLoading, router]);

  const checkAdminStatus = async () => {
    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/admin/templates', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setIsAdmin(true);
        loadTemplates();
        loadBrands();
      } else {
        console.error('No tienes permisos de administrador');
        router.push('/');
      }
    } catch (error) {
      console.error('Error verificando admin:', error);
      router.push('/');
    }
  };

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const token = await user?.getIdToken();
      const response = await fetch('/api/admin/templates', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Error al cargar templates');

      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBrands = async () => {
    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/admin/brands', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Error al cargar configuraciones de marca');

      const data = await response.json();
      setBrands(data.brands || []);
    } catch (error) {
      console.error('Error loading brands:', error);
    }
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setShowForm(true);
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('¿Estás seguro de eliminar este template?')) return;

    try {
      const token = await user?.getIdToken();
      const response = await fetch(`/api/admin/templates?templateId=${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Error al eliminar template');

      // Recargar templates
      await loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Error al eliminar template');
    }
  };

  const handleToggleActive = async (template: Template) => {
    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/admin/templates', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: template.id,
          isActive: !template.isActive,
        }),
      });

      if (!response.ok) throw new Error('Error al actualizar template');

      // Recargar templates
      await loadTemplates();
    } catch (error) {
      console.error('Error toggling active:', error);
      alert('Error al actualizar template');
    }
  };

  const handleFormSuccess = async () => {
    setShowForm(false);
    setEditingTemplate(null);
    await loadTemplates();
  };

  const handleCreateBrand = () => {
    setEditingBrand(null);
    setShowBrandForm(true);
  };

  const handleEditBrand = (brand: BrandConfig) => {
    setEditingBrand(brand);
    setShowBrandForm(true);
  };

  const handleDeleteBrand = async (brandId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta configuración de marca?')) return;

    try {
      const token = await user?.getIdToken();
      const response = await fetch(`/api/admin/brands?id=${brandId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Error al eliminar configuración');

      await loadBrands();
    } catch (error) {
      console.error('Error deleting brand:', error);
      alert('Error al eliminar configuración de marca');
    }
  };

  const handleToggleBrandActive = async (brand: BrandConfig) => {
    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/admin/brands', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: brand.id,
          isActive: !brand.isActive,
        }),
      });

      if (!response.ok) throw new Error('Error al actualizar configuración');

      await loadBrands();
    } catch (error) {
      console.error('Error toggling brand active:', error);
      alert('Error al actualizar configuración de marca');
    }
  };

  const handleBrandFormSuccess = async () => {
    setShowBrandForm(false);
    setEditingBrand(null);
    await loadBrands();
  };

  // Filter templates by selected brand
  const filteredTemplates = selectedBrandFilter === 'all'
    ? templates
    : templates.filter(t => {
        // Show templates with no websiteUrl (shared) or matching websiteUrl
        return !t.websiteUrl || t.websiteUrl === selectedBrandFilter;
      });

  // Get brand name for a template
  const getBrandName = (websiteUrl?: string) => {
    if (!websiteUrl) return '🌐 Todos los sitios';
    const brand = brands.find(b => b.domain === websiteUrl);
    return brand ? brand.name : websiteUrl;
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header - Mobile Optimized */}
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase italic">
                Admin Panel
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                {activeTab === 'templates' ? 'Gestiona los templates de Face Swap' : 'Gestiona las configuraciones de marca'}
              </p>
            </div>
            <button
              onClick={activeTab === 'templates' ? handleCreateTemplate : handleCreateBrand}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold hover:shadow-lg hover:shadow-pink-500/30 transition-all active:scale-95 w-full sm:w-auto"
            >
              <Plus size={20} />
              <span className="text-sm">
                {activeTab === 'templates' ? 'Nuevo Template' : 'Nueva Marca'}
              </span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                activeTab === 'templates'
                  ? 'bg-pink-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              Templates
            </button>
            <button
              onClick={() => setActiveTab('brands')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
                activeTab === 'brands'
                  ? 'bg-pink-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <Globe size={16} />
              Marcas
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <>
            {/* Brand Filter */}
            {brands.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-bold mb-2">Filtrar por Marca</label>
                <select
                  value={selectedBrandFilter}
                  onChange={(e) => setSelectedBrandFilter(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-pink-500/50 focus:outline-none text-sm min-w-[250px]"
                >
                  <option value="all">🌐 Todas las marcas</option>
                  <option value="">📦 Solo compartidos (sin marca)</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.domain}>
                      {brand.name} ({brand.domain})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  Mostrando {filteredTemplates.length} de {templates.length} templates
                </p>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
              </div>
            ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-4">
              {templates.length === 0
                ? 'No hay templates creados'
                : `No hay templates para ${selectedBrandFilter === 'all' ? 'mostrar' : selectedBrandFilter === '' ? 'compartidos' : getBrandName(selectedBrandFilter)}`
              }
            </p>
            {templates.length === 0 && (
              <button
                onClick={handleCreateTemplate}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold active:scale-95 transition-all"
              >
                Crear el primero
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-pink-500/30 transition-all"
              >
                {/* Image */}
                <div className="relative aspect-[3/4] bg-black">
                  <img
                    src={template.imageUrl}
                    alt={template.title}
                    className="w-full h-full object-cover"
                  />
                  {!template.isActive && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="px-3 py-1 rounded-full bg-red-500/20 border border-red-500 text-red-400 text-xs font-bold">
                        INACTIVO
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-bold text-base sm:text-lg mb-1">{template.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-400 line-clamp-2 mb-3">
                    {template.description}
                  </p>

                  {/* Brand Badge */}
                  <div className="mb-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-pink-300">
                      <Globe size={12} />
                      {getBrandName(template.websiteUrl)}
                    </span>
                    {/* Debug info - muestra el websiteUrl exacto */}
                    <p className="text-[10px] text-gray-600 mt-1">
                      URL: {template.websiteUrl || '(vacío - compartido)'}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <span>{template.usageCount || 0} usos</span>
                    {template.isPremium && (
                      <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                        Premium
                      </span>
                    )}
                  </div>

                  {/* Actions - Mobile Optimized */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(template)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-xs sm:text-sm active:scale-95 touch-manipulation"
                    >
                      {template.isActive ? (
                        <>
                          <Eye size={14} />
                          <span className="hidden sm:inline">Activo</span>
                        </>
                      ) : (
                        <>
                          <EyeOff size={14} />
                          <span className="hidden sm:inline">Inactivo</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="p-2.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-all active:scale-95 touch-manipulation"
                      aria-label="Editar template"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all active:scale-95 touch-manipulation"
                      aria-label="Eliminar template"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
          </>
        )}

        {/* Brands Tab */}
        {activeTab === 'brands' && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
              </div>
            ) : brands.length === 0 ? (
              <div className="text-center py-20">
                <Globe className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">No hay configuraciones de marca</p>
                <button
                  onClick={handleCreateBrand}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold active:scale-95 transition-all"
                >
                  Crear la primera
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {brands.map((brand) => (
                  <div
                    key={brand.id}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-pink-500/30 transition-all"
                  >
                    {/* Logo */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden">
                        {brand.logo && brand.logo.startsWith('http') ? (
                          <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain p-2" />
                        ) : (
                          <Globe size={32} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-black text-lg">{brand.name}</h3>
                        <p className="text-sm text-gray-400">{brand.domain}</p>
                      </div>
                    </div>

                    {/* Theme */}
                    {brand.themeId && (
                      <div className="mb-4">
                        <span className="text-xs text-gray-500">Tema:</span>
                        <span className="ml-2 text-sm font-bold capitalize">{brand.themeId}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleBrandActive(brand)}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                          brand.isActive
                            ? 'bg-green-500/10 hover:bg-green-500/20 text-green-400'
                            : 'bg-gray-500/10 hover:bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {brand.isActive ? (
                          <>
                            <Eye size={14} />
                            <span className="hidden sm:inline">Activo</span>
                          </>
                        ) : (
                          <>
                            <EyeOff size={14} />
                            <span className="hidden sm:inline">Inactivo</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleEditBrand(brand)}
                        className="p-2.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-all active:scale-95"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteBrand(brand.id)}
                        className="p-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all active:scale-95"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Template Form Modal */}
      {showForm && (
        <TemplateForm
          template={editingTemplate}
          onClose={() => {
            setShowForm(false);
            setEditingTemplate(null);
          }}
          onSuccess={handleFormSuccess}
          user={user!}
        />
      )}

      {/* Brand Form Modal */}
      {showBrandForm && (
        <BrandConfigForm
          brand={editingBrand}
          onClose={() => {
            setShowBrandForm(false);
            setEditingBrand(null);
          }}
          onSuccess={handleBrandFormSuccess}
          user={user!}
        />
      )}
    </div>
  );
}
