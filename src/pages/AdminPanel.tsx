import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Radio,
  Settings,
  Calendar,
  Play,
  Edit,
  Trash2,
  Plus,
  Megaphone,
  CheckCircle2,
  AlertCircle,
  Info as InfoIcon,
  X,
  CreditCard,
  Users,
  History,
  ExternalLink,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Radio as RadioType } from '@/types/database';
import { AdminLayout } from '@/components/AdminLayout';
import { cn } from '@/lib/utils';
import { ROLES } from '@/types/auth';

const RadioCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse border border-gray-100 dark:bg-[#2b2c40] dark:border-transparent">
    <div className="w-full h-32 bg-gray-200 dark:bg-[#323249]" />
    <div className="p-4">
      <div className="space-y-3">
        <div className="h-5 bg-gray-200 dark:bg-[#323249] rounded w-3/4" />
        <div className="h-4 bg-gray-200 dark:bg-[#323249] rounded w-1/4" />
        <div className="space-y-2 pt-2">
          <div className="h-3 bg-gray-200 dark:bg-[#323249] rounded w-full" />
          <div className="h-3 bg-gray-200 dark:bg-[#323249] rounded w-5/6" />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="h-10 bg-gray-200 dark:bg-[#323249] rounded-lg" />
          <div className="h-10 bg-gray-200 dark:bg-[#323249] rounded-lg" />
          <div className="h-10 bg-gray-200 dark:bg-[#323249] rounded-lg col-span-2" />
        </div>
      </div>
    </div>
  </div>
);

const formatRenewalDate = (dateValue?: string | null) => {
  if (!dateValue) return null;

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString('es-AR');
};

const getSubscriptionCta = (radio: RadioType) => {
  const subscriptionStatus = (radio as any).subscription_status;
  const hasPlan = Boolean((radio as any).plan_name);

  if (subscriptionStatus === 'active') {
    return {
      label: 'Ver pagos',
      path: '/admin/payments',
      className:
        'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:hover:bg-emerald-900/20',
      icon: History,
    };
  }

  if (hasPlan) {
    return {
      label: 'Regularizar plan',
      path: '/admin/payments',
      className:
        'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/10 dark:text-amber-400 dark:hover:bg-amber-900/20',
      icon: CreditCard,
    };
  }

  return {
    label: 'Activar plan',
    path: '/planes',
    className:
      'bg-[#696cff]/10 text-[#696cff] hover:bg-[#696cff]/20 dark:bg-[#696cff]/15 dark:text-[#8f92ff] dark:hover:bg-[#696cff]/25',
    icon: ExternalLink,
  };
};

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const [radios, setRadios] = useState<RadioType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'payment_success') {
      setNotification({
        type: 'success',
        message: 'Pago procesado con exito. Tu suscripcion se activara automaticamente en unos instantes.',
      });
      searchParams.delete('status');
      setSearchParams(searchParams, { replace: true });
    } else if (status === 'payment_error') {
      setNotification({
        type: 'error',
        message: 'No pudimos confirmar el pago. Puedes reintentar desde Historial de Pagos o revisar el estado en unos minutos.',
      });
      searchParams.delete('status');
      setSearchParams(searchParams, { replace: true });
    } else if (status === 'payment_pending') {
      setNotification({
        type: 'info',
        message: 'Tu pago esta pendiente de confirmacion. Te avisaremos por email una vez acreditado.',
      });
      searchParams.delete('status');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!user || (user.role !== ROLES.RADIO_ADMIN && user.role !== ROLES.SUPER_ADMIN)) {
      navigate('/login');
      return;
    }

    const fetchUserRadios = async () => {
      try {
        setIsLoading(true);
        let query = supabase.from('radio_subscription_status').select('*').order('created_at', { ascending: false });

        if (user.role !== ROLES.SUPER_ADMIN) {
          query = query.eq('user_id', user.id);
        }

        const { data, error } = await query;

        if (error) throw error;
        setRadios(data || []);
      } catch (error) {
        console.error('Error fetching radios:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRadios();
  }, [user, navigate]);

  const handleDeleteRadio = async (radio: RadioType) => {
    const confirmMessage =
      user?.role === ROLES.SUPER_ADMIN
        ? `Vas a eliminar la emisora "${radio.name}" junto con sus anuncios, suscripciones y cobros asociados. Deseas continuar?`
        : `Estas seguro de que quieres eliminar la emisora "${radio.name}"?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    const originalRadios = [...radios];
    setRadios((prev) => prev.filter((currentRadio) => currentRadio.id !== radio.id));

    try {
      await api.deleteRadio(radio.id);
    } catch (error) {
      console.error('Error deleting radio:', error);
      alert('No pudimos eliminar la emisora. Revisa si tiene datos relacionados con permisos o vuelve a intentarlo.');
      setRadios(originalRadios);
    }
  };

  const quickActions = [
    ...(user?.role === ROLES.SUPER_ADMIN
      ? [
          {
            label: 'Usuarios',
            icon: Users,
            path: '/admin/users',
            className: 'bg-[#696cff]/10 text-[#696cff] hover:bg-[#696cff]/20',
          },
          {
            label: 'Cobros',
            icon: CreditCard,
            path: '/admin/billing',
            className: 'bg-[#71dd37]/10 text-[#71dd37] hover:bg-[#71dd37]/20',
          },
          {
            label: 'Planes',
            icon: Settings,
            path: '/admin/planes',
            className: 'bg-[#03c3ec]/10 text-[#03c3ec] hover:bg-[#03c3ec]/20',
          },
          {
            label: 'Config',
            icon: Settings,
            path: '/admin/settings',
            className: 'bg-[#697a8d]/10 text-[#697a8d] hover:bg-[#697a8d]/20',
          },
        ]
      : []),
    {
      label: 'Pagos',
      icon: History,
      path: '/admin/payments',
      className: 'bg-[#696cff]/10 text-[#696cff] hover:bg-[#696cff]/20',
    },
    {
      label: 'Sitio',
      icon: ExternalLink,
      path: '/',
      className: 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-[#323249] dark:text-[#cbcbe2] dark:hover:bg-[#3a3b55]',
    },
    {
      label: 'Nueva',
      icon: Plus,
      path: '/admin/profile/new',
      className: 'bg-[#696cff] text-white hover:bg-[#5f61e6] shadow-sm shadow-[#696cff]/20',
    },
  ];

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredRadios = radios.filter((radio) => {
    if (!normalizedSearchTerm) return true;

    const searchableFields = [
      radio.name,
      radio.frequency,
      radio.location,
      (radio as any).plan_name,
      (radio as any).subscription_status,
    ];

    return searchableFields.some((field) => field?.toLowerCase().includes(normalizedSearchTerm));
  });

  const activeSubscriptionsCount = radios.filter(
    (radio) => (radio as any).subscription_status === 'active'
  ).length;

  const radiosWithPlanCount = radios.filter((radio) => Boolean((radio as any).plan_name)).length;

  const nextRenewalRadio = radios
    .filter((radio) => Boolean((radio as any).next_billing_date))
    .sort((a, b) => {
      const dateA = new Date((a as any).next_billing_date).getTime();
      const dateB = new Date((b as any).next_billing_date).getTime();
      return dateA - dateB;
    })[0];

  const nextRenewalDate = formatRenewalDate((nextRenewalRadio as any)?.next_billing_date);
  const planSummaryLabel =
    radios.length === 0
      ? 'Sin datos'
      : radiosWithPlanCount === 0
        ? 'Sin plan'
        : radiosWithPlanCount === 1
          ? '1 emisora con plan'
          : `${radiosWithPlanCount} emisoras con plan`;

  if (isLoading) {
    return (
      <AdminLayout title="Panel de Administracion" subtitle="Cargando emisoras...">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(3)].map((_, index) => (
              <RadioCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Panel de Administracion"
      subtitle="Gestion de emisoras y contenido"
      searchPlaceholder="Buscar por nombre, frecuencia, ubicacion o plan..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
    >
      <div className="max-w-6xl mx-auto space-y-5 sm:space-y-8">
        {notification && (
          <div
            className={cn(
              'p-4 rounded-xl border flex items-start gap-3 relative animate-in fade-in slide-in-from-top-4 duration-300',
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800/30 dark:text-emerald-400'
                : notification.type === 'error'
                  ? 'bg-red-50 border-red-100 text-red-800 dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-400'
                  : 'bg-blue-50 border-blue-100 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800/30 dark:text-blue-400'
            )}
          >
            {notification.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />}
            {notification.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />}
            {notification.type === 'info' && <InfoIcon className="w-5 h-5 shrink-0 text-blue-500" />}

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">{notification.type === 'success' ? 'Excelente' : 'Aviso'}</p>
              <p className="text-sm opacity-90">{notification.message}</p>
            </div>

            <button onClick={() => setNotification(null)} className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-[#2b2c40] rounded-xl shadow-sm border border-gray-100 dark:border-transparent p-5 sm:p-6 flex items-center space-x-4 transition-colors">
            <div className="p-3 bg-[#696cff]/10 rounded-lg">
              <Radio className="w-6 h-6 text-[#696cff]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#a1acb8] dark:text-[#7e7e9a] uppercase">Total Emisoras</p>
              <p className="text-2xl font-bold text-[#566a7f] dark:text-[#cbcbe2]">{radios.length}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#2b2c40] rounded-xl shadow-sm border border-gray-100 dark:border-transparent p-5 sm:p-6 flex items-center space-x-4 transition-colors">
            <div className="p-3 bg-[#71dd37]/10 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-[#71dd37]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#a1acb8] dark:text-[#7e7e9a] uppercase">Suscripciones activas</p>
              <p className="text-2xl font-bold text-[#71dd37]">{activeSubscriptionsCount}</p>
              <p className="text-xs text-[#a1acb8] dark:text-[#7e7e9a] mt-1">
                {radios.length === 0
                  ? 'Aun no hay emisoras registradas'
                  : `${radios.length - activeSubscriptionsCount} sin cobertura activa`}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#2b2c40] rounded-xl shadow-sm border border-gray-100 dark:border-transparent p-5 sm:p-6 flex items-center space-x-4 transition-colors sm:col-span-2 xl:col-span-1">
            <div className="p-3 bg-[#03c3ec]/10 rounded-lg">
              <CreditCard className="w-6 h-6 text-[#03c3ec]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#a1acb8] dark:text-[#7e7e9a] uppercase">Cobertura y renovacion</p>
              <p className="text-2xl font-bold text-[#566a7f] dark:text-[#cbcbe2] truncate">{planSummaryLabel}</p>
              <p className="text-xs text-[#a1acb8] dark:text-[#7e7e9a] mt-1 truncate">
                {nextRenewalDate && nextRenewalRadio
                  ? `Proxima renovacion: ${nextRenewalRadio.name} el ${nextRenewalDate}`
                  : 'Sin renovaciones programadas'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#2b2c40] rounded-xl shadow-sm border border-gray-100 dark:border-transparent overflow-hidden transition-colors">
          <div className="p-4 sm:p-6 border-b border-gray-50 dark:border-[#444564] flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg sm:text-xl font-bold text-[#566a7f] dark:text-[#cbcbe2]">Mis Emisoras</h2>
              <span className="text-xs sm:text-sm text-[#a1acb8] dark:text-[#7e7e9a]">
                {filteredRadios.length} de {radios.length} registradas
              </span>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
              {quickActions.map((action) => (
                <button
                  key={`${action.label}-${action.path}`}
                  onClick={() => navigate(action.path)}
                  className={`${action.className} px-3 py-3 sm:px-4 sm:py-2 rounded-xl transition-all flex items-center justify-center space-x-2 text-xs sm:text-sm font-semibold`}
                >
                  <action.icon className="w-4 h-4" />
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {radios.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Radio className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-[#566a7f] dark:text-[#cbcbe2] mb-1">No hay emisoras registradas</h3>
                <p className="text-[#a1acb8] dark:text-[#7e7e9a] mb-6 text-sm">Crea tu primera emisora para comenzar a transmitir.</p>
                <button
                  onClick={() => navigate('/admin/profile/new')}
                  className="bg-[#696cff]/10 text-[#696cff] px-6 py-3 rounded-xl hover:bg-[#696cff]/20 transition-all font-bold"
                >
                  Comenzar ahora
                </button>
              </div>
            ) : filteredRadios.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Radio className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-[#566a7f] dark:text-[#cbcbe2] mb-1">No encontramos coincidencias</h3>
                <p className="text-[#a1acb8] dark:text-[#7e7e9a] mb-6 text-sm">
                  Prueba con otro nombre, frecuencia, ubicacion o plan.
                </p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="bg-[#696cff]/10 text-[#696cff] px-6 py-3 rounded-xl hover:bg-[#696cff]/20 transition-all font-bold"
                >
                  Limpiar busqueda
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {filteredRadios.map((radio) => {
                  const subscriptionCta = getSubscriptionCta(radio);

                  return (
                  <div key={radio.id} className="group bg-white dark:bg-[#232333] rounded-xl border border-gray-100 dark:border-transparent overflow-hidden hover:shadow-md transition-all duration-300">
                    <div className="relative h-36 sm:h-32">
                      {radio.cover_url ? (
                        <img src={radio.cover_url} alt={radio.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#696cff] to-[#787bff] flex items-center justify-center">
                          <Radio className="w-10 h-10 text-white opacity-20" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <span className="bg-white/90 backdrop-blur-sm text-[#696cff] text-[10px] font-bold px-2 py-1 rounded-md uppercase shadow-sm">
                          {radio.frequency}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 sm:p-5">
                      <h3 className="font-bold text-[#566a7f] dark:text-[#cbcbe2] truncate mb-1">{radio.name}</h3>
                      <p className="text-xs text-[#a1acb8] dark:text-[#7e7e9a] flex items-center mb-4">
                        <Play className="w-3 h-3 mr-1 shrink-0" />
                        <span className="truncate">{radio.location || 'Emisora online'}</span>
                      </p>
                      <div className="mb-4 flex flex-wrap gap-2">
                        <span className={cn(
                          'rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase',
                          (radio as any).subscription_status === 'active'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : 'bg-amber-50 text-amber-600 border border-amber-100'
                        )}>
                          {(radio as any).subscription_status === 'active' ? 'Suscripcion activa' : 'Sin suscripcion activa'}
                        </span>
                        {formatRenewalDate((radio as any).next_billing_date) && (
                          <span className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-500 dark:border-[#444564] dark:bg-[#2b2c40] dark:text-[#a3a4cc]">
                            Renueva {formatRenewalDate((radio as any).next_billing_date)}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => navigate(subscriptionCta.path)}
                        className={cn(
                          'mb-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 sm:py-2.5 text-xs font-semibold transition-colors',
                          subscriptionCta.className
                        )}
                      >
                        <subscriptionCta.icon className="w-3.5 h-3.5" />
                        <span>{subscriptionCta.label}</span>
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => navigate(`/admin/profile/${radio.id}`)}
                          className="flex items-center justify-center space-x-1 py-3 sm:py-2.5 bg-gray-50 dark:bg-[#2b2c40] text-[#697a8d] dark:text-[#a3a4cc] rounded-xl hover:bg-gray-100 dark:hover:bg-[#323249] transition-colors text-xs font-semibold"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => navigate(`/admin/schedule/${radio.id}`)}
                          className="flex items-center justify-center space-x-1 py-3 sm:py-2.5 bg-[#696cff]/10 text-[#696cff] rounded-xl hover:bg-[#696cff]/20 transition-colors text-xs font-semibold"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Horarios</span>
                        </button>
                        <button
                          onClick={() => navigate(`/admin/anuncios/${radio.id}`)}
                          className="py-3 sm:py-2.5 bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors text-xs font-semibold flex items-center justify-center space-x-1"
                        >
                          <Megaphone className="w-3.5 h-3.5" />
                          <span>Anuncios</span>
                        </button>
                        <button
                          onClick={() => handleDeleteRadio(radio)}
                          className="py-3 sm:py-2.5 text-[#ff3e1d] hover:bg-[#ff3e1d]/5 rounded-xl transition-colors text-xs font-semibold flex items-center justify-center space-x-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPanel;
