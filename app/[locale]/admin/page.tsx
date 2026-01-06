'use client';
// Force dynamic rendering
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth/AuthProvider';
import { Plus, Edit2, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Template } from '@/types/template';
import { TemplateForm } from '@/app/components/TemplateForm';

export default function AdminPanel() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
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

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight uppercase italic">
                Admin Panel
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Gestiona los templates de Face Swap
              </p>
            </div>
            <button
              onClick={handleCreateTemplate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold hover:shadow-lg hover:shadow-pink-500/30 transition-all"
            >
              <Plus size={20} />
              Nuevo Template
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-4">No hay templates creados</p>
            <button
              onClick={handleCreateTemplate}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold"
            >
              Crear el primero
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
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
                  <h3 className="font-bold text-lg mb-1">{template.title}</h3>
                  <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                    {template.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <span>{template.usageCount || 0} usos</span>
                    {template.isPremium && (
                      <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                        Premium
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(template)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-sm"
                    >
                      {template.isActive ? (
                        <>
                          <Eye size={14} />
                          Activo
                        </>
                      ) : (
                        <>
                          <EyeOff size={14} />
                          Inactivo
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
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
    </div>
  );
}
