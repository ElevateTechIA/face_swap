'use client';
// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/auth/AuthProvider';
import { ScreenerQuestion } from '@/types/template';
import { Plus, Trash2, Edit, Save, X, Loader2 } from 'lucide-react';

export default function ScreenerQuestionsAdmin() {
  const { user, loading: authLoading, getUserIdToken } = useAuth();
  const [questions, setQuestions] = useState<ScreenerQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Formulario para nueva pregunta
  const [newQuestion, setNewQuestion] = useState({
    multiSelect: true,
    category: 'preferences' as const,
    optionKeys: '',
    labelES: '',
    labelEN: '',
    optionsES: '',  // "Atlético, Delgado, Curvy"
    optionsEN: '',  // "Athletic, Slim, Curvy"
  });

  // Formulario para editar pregunta
  const [editQuestion, setEditQuestion] = useState<{
    id: string;
    multiSelect: boolean;
    category: 'preferences' | 'style' | 'occasions' | 'mood';
    optionKeys: string;
    labelES: string;
    labelEN: string;
    optionsES: string;
    optionsEN: string;
    isActive: boolean;
    order: number;
  }>({
    id: '',
    multiSelect: true,
    category: 'preferences',
    optionKeys: '',
    labelES: '',
    labelEN: '',
    optionsES: '',
    optionsEN: '',
    isActive: true,
    order: 0,
  });

  useEffect(() => {
    if (!authLoading) {
      loadQuestions();
    }
  }, [authLoading]);

  const loadQuestions = async () => {
    try {
      setIsLoading(true);

      // Obtener token de autenticación
      const token = await getUserIdToken();
      if (!token) {
        console.error('No se pudo obtener el token de autenticación');
        return;
      }

      const response = await fetch('/api/screener-questions?includeAnswered=true&limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions || []);
      } else {
        console.error('Error al cargar preguntas:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      // Validaciones
      if (!newQuestion.optionKeys || !newQuestion.labelES || !newQuestion.labelEN) {
        alert('Por favor, completa todos los campos obligatorios');
        return;
      }

      // Procesar option keys
      const optionKeys = newQuestion.optionKeys.split(',').map(o => o.trim()).filter(Boolean);

      // Procesar opciones en español
      const optionsESArray = newQuestion.optionsES.split(',').map(o => o.trim()).filter(Boolean);

      // Procesar opciones en inglés
      const optionsENArray = newQuestion.optionsEN.split(',').map(o => o.trim()).filter(Boolean);

      // Validar que haya la misma cantidad de opciones
      if (optionKeys.length !== optionsESArray.length || optionKeys.length !== optionsENArray.length) {
        alert('La cantidad de claves y traducciones debe coincidir');
        return;
      }

      // Construir objeto de traducciones
      const optionsESObject: Record<string, string> = {};
      const optionsENObject: Record<string, string> = {};

      optionKeys.forEach((key, index) => {
        optionsESObject[key] = optionsESArray[index];
        optionsENObject[key] = optionsENArray[index];
      });

      const translations = {
        es: {
          label: newQuestion.labelES,
          options: optionsESObject,
        },
        en: {
          label: newQuestion.labelEN,
          options: optionsENObject,
        },
      };

      console.log('📝 Creating question with translations:', translations);

      // Obtener token de autenticación
      const token = await getUserIdToken();
      if (!token) {
        alert('Error: No se pudo obtener el token de autenticación');
        return;
      }

      const response = await fetch('/api/screener-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          multiSelect: newQuestion.multiSelect,
          category: newQuestion.category,
          optionKeys,
          translations,
        }),
      });

      if (response.ok) {
        alert('✅ Pregunta creada exitosamente!');
        setIsCreating(false);
        setNewQuestion({
          multiSelect: true,
          category: 'preferences',
          optionKeys: '',
          labelES: '',
          labelEN: '',
          optionsES: '',
          optionsEN: '',
        });
        loadQuestions();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Error al crear pregunta'}`);
      }
    } catch (error) {
      console.error('Error creating question:', error);
      alert('Error al crear pregunta');
    }
  };

  const handleEdit = (question: ScreenerQuestion) => {
    // Pre-populate edit form with question data
    setEditQuestion({
      id: question.id,
      multiSelect: question.multiSelect,
      category: question.category || 'preferences',
      optionKeys: question.optionKeys.join(', '),
      labelES: question.translations.es.label,
      labelEN: question.translations.en.label,
      optionsES: question.optionKeys.map(key => question.translations.es.options[key]).join(', '),
      optionsEN: question.optionKeys.map(key => question.translations.en.options[key]).join(', '),
      isActive: question.isActive,
      order: question.order,
    });
    setEditingId(question.id);
    setIsCreating(false);
  };

  const handleUpdate = async () => {
    try {
      // Validaciones
      if (!editQuestion.optionKeys || !editQuestion.labelES || !editQuestion.labelEN) {
        alert('Por favor, completa todos los campos obligatorios');
        return;
      }

      // Procesar option keys
      const optionKeys = editQuestion.optionKeys.split(',').map(o => o.trim()).filter(Boolean);

      // Procesar opciones en español
      const optionsESArray = editQuestion.optionsES.split(',').map(o => o.trim()).filter(Boolean);

      // Procesar opciones en inglés
      const optionsENArray = editQuestion.optionsEN.split(',').map(o => o.trim()).filter(Boolean);

      // Validar que haya la misma cantidad de opciones
      if (optionKeys.length !== optionsESArray.length || optionKeys.length !== optionsENArray.length) {
        alert('La cantidad de claves y traducciones debe coincidir');
        return;
      }

      // Construir objeto de traducciones
      const optionsESObject: Record<string, string> = {};
      const optionsENObject: Record<string, string> = {};

      optionKeys.forEach((key, index) => {
        optionsESObject[key] = optionsESArray[index];
        optionsENObject[key] = optionsENArray[index];
      });

      const translations = {
        es: {
          label: editQuestion.labelES,
          options: optionsESObject,
        },
        en: {
          label: editQuestion.labelEN,
          options: optionsENObject,
        },
      };

      console.log('📝 Updating question with translations:', translations);

      // Obtener token de autenticación
      const token = await getUserIdToken();
      if (!token) {
        alert('Error: No se pudo obtener el token de autenticación');
        return;
      }

      const response = await fetch('/api/screener-questions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: editQuestion.id,
          multiSelect: editQuestion.multiSelect,
          category: editQuestion.category,
          optionKeys,
          translations,
          isActive: editQuestion.isActive,
          order: editQuestion.order,
        }),
      });

      if (response.ok) {
        alert('✅ Pregunta actualizada exitosamente!');
        setEditingId(null);
        loadQuestions();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Error al actualizar pregunta'}`);
      }
    } catch (error) {
      console.error('Error updating question:', error);
      alert('Error al actualizar pregunta');
    }
  };

  const handleDelete = async (questionId: string) => {
    try {
      // Obtener token de autenticación
      const token = await getUserIdToken();
      if (!token) {
        alert('Error: No se pudo obtener el token de autenticación');
        return;
      }

      const response = await fetch('/api/screener-questions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id: questionId }),
      });

      if (response.ok) {
        alert('✅ Pregunta eliminada exitosamente!');
        setDeletingId(null);
        loadQuestions();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Error al eliminar pregunta'}`);
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Error al eliminar pregunta');
    }
  };

  const handleToggleActive = async (question: ScreenerQuestion) => {
    try {
      // Obtener token de autenticación
      const token = await getUserIdToken();
      if (!token) {
        alert('Error: No se pudo obtener el token de autenticación');
        return;
      }

      const response = await fetch('/api/screener-questions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: question.id,
          isActive: !question.isActive,
        }),
      });

      if (response.ok) {
        loadQuestions();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Error al actualizar pregunta'}`);
      }
    } catch (error) {
      console.error('Error toggling question:', error);
      alert('Error al actualizar pregunta');
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-pink-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <p className="text-xl">Acceso no autorizado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black mb-2">Preguntas del Screener</h1>
            <p className="text-gray-400">
              Gestiona las preguntas que se muestran durante el procesamiento
            </p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full font-bold flex items-center gap-2"
          >
            <Plus size={20} />
            Nueva Pregunta
          </button>
        </div>

        {/* Editar pregunta existente */}
        {editingId && (
          <div className="bg-gray-900 border border-yellow-600/30 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Editar Pregunta</h3>
              <button
                onClick={() => setEditingId(null)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Claves de Opciones */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Claves de Opciones (separadas por coma)
                </label>
                <input
                  type="text"
                  value={editQuestion.optionKeys}
                  onChange={(e) => setEditQuestion({ ...editQuestion, optionKeys: e.target.value })}
                  className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white"
                  placeholder="slim, athletic, curvy, average"
                />
                <p className="text-xs text-gray-500 mt-1">Identificadores neutrales (sin espacios)</p>
              </div>

              {/* Traducción Español */}
              <div className="border border-pink-600/20 rounded-xl p-4 bg-pink-600/5">
                <h4 className="font-bold mb-3 text-pink-400">🇪🇸 Español</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Pregunta (ES)</label>
                    <input
                      type="text"
                      value={editQuestion.labelES}
                      onChange={(e) => setEditQuestion({ ...editQuestion, labelES: e.target.value })}
                      className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white"
                      placeholder="¿Qué tipo de cuerpo prefieres?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Opciones (ES)</label>
                    <input
                      type="text"
                      value={editQuestion.optionsES}
                      onChange={(e) => setEditQuestion({ ...editQuestion, optionsES: e.target.value })}
                      className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white"
                      placeholder="Delgado, Atlético, Curvy, Promedio"
                    />
                    <p className="text-xs text-gray-500 mt-1">Mismo orden que las claves</p>
                  </div>
                </div>
              </div>

              {/* Traducción Inglés */}
              <div className="border border-blue-600/20 rounded-xl p-4 bg-blue-600/5">
                <h4 className="font-bold mb-3 text-blue-400">🇺🇸 English</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Question (EN)</label>
                    <input
                      type="text"
                      value={editQuestion.labelEN}
                      onChange={(e) => setEditQuestion({ ...editQuestion, labelEN: e.target.value })}
                      className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white"
                      placeholder="What body type do you prefer?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Options (EN)</label>
                    <input
                      type="text"
                      value={editQuestion.optionsEN}
                      onChange={(e) => setEditQuestion({ ...editQuestion, optionsEN: e.target.value })}
                      className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white"
                      placeholder="Slim, Athletic, Curvy, Average"
                    />
                    <p className="text-xs text-gray-500 mt-1">Same order as keys</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Categoría</label>
                  <select
                    value={editQuestion.category}
                    onChange={(e) => setEditQuestion({ ...editQuestion, category: e.target.value as any })}
                    className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white"
                  >
                    <option value="preferences">Preferences</option>
                    <option value="style">Style</option>
                    <option value="occasions">Occasions</option>
                    <option value="mood">Mood</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tipo</label>
                  <select
                    value={editQuestion.multiSelect ? 'multi' : 'single'}
                    onChange={(e) => setEditQuestion({ ...editQuestion, multiSelect: e.target.value === 'multi' })}
                    className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white"
                  >
                    <option value="multi">Multi-select</option>
                    <option value="single">Single-select</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Estado</label>
                  <select
                    value={editQuestion.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setEditQuestion({ ...editQuestion, isActive: e.target.value === 'active' })}
                    className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white"
                  >
                    <option value="active">Activa</option>
                    <option value="inactive">Inactiva</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleUpdate}
                className="w-full px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-full font-bold flex items-center justify-center gap-2"
              >
                <Save size={20} />
                Actualizar Pregunta
              </button>
            </div>
          </div>
        )}

        {/* Crear nueva pregunta */}
        {isCreating && (
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Crear Nueva Pregunta</h3>
              <button
                onClick={() => setIsCreating(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Claves de Opciones */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Claves de Opciones (separadas por coma)
                </label>
                <input
                  type="text"
                  value={newQuestion.optionKeys}
                  onChange={(e) => setNewQuestion({ ...newQuestion, optionKeys: e.target.value })}
                  className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white"
                  placeholder="slim, athletic, curvy, average"
                />
                <p className="text-xs text-gray-500 mt-1">Identificadores neutrales (sin espacios)</p>
              </div>

              {/* Traducción Español */}
              <div className="border border-pink-600/20 rounded-xl p-4 bg-pink-600/5">
                <h4 className="font-bold mb-3 text-pink-400">🇪🇸 Español</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Pregunta (ES)</label>
                    <input
                      type="text"
                      value={newQuestion.labelES}
                      onChange={(e) => setNewQuestion({ ...newQuestion, labelES: e.target.value })}
                      className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white"
                      placeholder="¿Qué tipo de cuerpo prefieres?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Opciones (ES)</label>
                    <input
                      type="text"
                      value={newQuestion.optionsES}
                      onChange={(e) => setNewQuestion({ ...newQuestion, optionsES: e.target.value })}
                      className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white"
                      placeholder="Delgado, Atlético, Curvy, Promedio"
                    />
                    <p className="text-xs text-gray-500 mt-1">Mismo orden que las claves</p>
                  </div>
                </div>
              </div>

              {/* Traducción Inglés */}
              <div className="border border-blue-600/20 rounded-xl p-4 bg-blue-600/5">
                <h4 className="font-bold mb-3 text-blue-400">🇺🇸 English</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Question (EN)</label>
                    <input
                      type="text"
                      value={newQuestion.labelEN}
                      onChange={(e) => setNewQuestion({ ...newQuestion, labelEN: e.target.value })}
                      className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white"
                      placeholder="What body type do you prefer?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Options (EN)</label>
                    <input
                      type="text"
                      value={newQuestion.optionsEN}
                      onChange={(e) => setNewQuestion({ ...newQuestion, optionsEN: e.target.value })}
                      className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white"
                      placeholder="Slim, Athletic, Curvy, Average"
                    />
                    <p className="text-xs text-gray-500 mt-1">Same order as keys</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Categoría</label>
                  <select
                    value={newQuestion.category}
                    onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value as any })}
                    className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white"
                  >
                    <option value="preferences">Preferences</option>
                    <option value="style">Style</option>
                    <option value="occasions">Occasions</option>
                    <option value="mood">Mood</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tipo</label>
                  <select
                    value={newQuestion.multiSelect ? 'multi' : 'single'}
                    onChange={(e) => setNewQuestion({ ...newQuestion, multiSelect: e.target.value === 'multi' })}
                    className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white"
                  >
                    <option value="multi">Multi-select</option>
                    <option value="single">Single-select</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleCreate}
                className="w-full px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full font-bold"
              >
                Crear Pregunta
              </button>
            </div>
          </div>
        )}

        {/* Lista de preguntas */}
        <div className="space-y-4">
          {questions.map((question) => (
            <div
              key={question.id}
              className="bg-gray-900 border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="mb-2">
                    <div className="text-xs text-pink-400 mb-1">🇪🇸 Español:</div>
                    <h3 className="text-lg font-bold mb-2">{question.translations.es.label}</h3>
                    <div className="text-xs text-blue-400 mb-1">🇺🇸 English:</div>
                    <h3 className="text-lg font-bold">{question.translations.en.label}</h3>
                  </div>
                  <div className="flex gap-2 text-sm mt-3">
                    <span className="px-2 py-1 bg-pink-600/20 text-pink-400 rounded">
                      {question.multiSelect ? 'Multi-select' : 'Single-select'}
                    </span>
                    <span className="px-2 py-1 bg-purple-600/20 text-purple-400 rounded">
                      {question.category}
                    </span>
                    <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded">
                      Orden: {question.order}
                    </span>
                    <span className={`px-2 py-1 rounded ${question.isActive ? 'bg-green-600/20 text-green-400' : 'bg-gray-600/20 text-gray-400'}`}>
                      {question.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleToggleActive(question)}
                    className={`p-2 rounded-lg transition-all ${
                      question.isActive
                        ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                        : 'bg-gray-600/20 text-gray-400 hover:bg-gray-600/30'
                    }`}
                    title={question.isActive ? 'Desactivar' : 'Activar'}
                  >
                    {question.isActive ? '👁️' : '👁️‍🗨️'}
                  </button>
                  <button
                    onClick={() => handleEdit(question)}
                    className="p-2 bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30 rounded-lg transition-all"
                    title="Editar pregunta"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => setDeletingId(question.id)}
                    className="p-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition-all"
                    title="Eliminar pregunta"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-2">Opciones:</p>
                <div className="flex flex-wrap gap-2">
                  {question.optionKeys.map((optionKey) => (
                    <span
                      key={optionKey}
                      className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm"
                    >
                      <span className="text-pink-400">{question.translations.es.options[optionKey]}</span>
                      {' / '}
                      <span className="text-blue-400">{question.translations.en.options[optionKey]}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {questions.length === 0 && !isCreating && (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No hay preguntas creadas</p>
            <button
              onClick={() => setIsCreating(true)}
              className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full font-bold"
            >
              Crear Primera Pregunta
            </button>
          </div>
        )}

        {/* Instrucciones */}
        <div className="mt-8 bg-blue-600/10 border border-blue-600/20 rounded-2xl p-6">
          <h3 className="font-bold mb-2">💡 Instrucciones</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>• Ejecuta <code className="px-2 py-1 bg-black/50 rounded">npx tsx scripts/reset-screener-questions.ts</code> para reiniciar las preguntas</li>
            <li>• Las preguntas aparecen durante el procesamiento del Face Swap (3 por sesión)</li>
            <li>• Los usuarios solo ven preguntas que no han respondido</li>
            <li>• Las traducciones se almacenan dinámicamente en Firebase</li>
            <li>• Usa el botón de edición para modificar preguntas existentes</li>
            <li>• El toggle activa/desactiva preguntas sin eliminarlas</li>
          </ul>
        </div>

        {/* Delete Confirmation Modal */}
        {deletingId && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-red-600/30 rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4 text-red-400">⚠️ Confirmar Eliminación</h3>
              <p className="text-gray-300 mb-6">
                ¿Estás seguro de que deseas eliminar esta pregunta? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingId(null)}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-full font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(deletingId)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-full font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} />
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
