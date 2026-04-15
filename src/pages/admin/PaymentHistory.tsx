import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CreditCard, Loader2, History, ArrowLeft, Zap, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/components/AdminLayout';
import { useAuthStore } from '@/stores/authStore';
import { ROLES } from '@/types/auth';

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  due_date: string;
  paid_at: string | null;
  status: 'paid' | 'pending' | 'void' | 'overdue';
  radio_name: string;
}

export const PaymentHistory: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    if (!user || (user.role !== ROLES.RADIO_ADMIN && user.role !== ROLES.SUPER_ADMIN)) {
      navigate('/login');
      return;
    }
    fetchInvoices();
  }, [user, navigate]);

  useEffect(() => {
    const status = searchParams.get('status');
    if (!status) return;

    if (status === 'payment_success') {
      setNotification({
        type: 'success',
        message: 'El pago fue enviado correctamente. La factura se actualizara cuando Mercado Pago confirme la acreditacion.',
      });
      fetchInvoices();
    } else if (status === 'payment_pending') {
      setNotification({
        type: 'info',
        message: 'El pago quedo pendiente de acreditacion. Te mostraremos la actualizacion apenas se confirme.',
      });
    } else if (status === 'payment_error') {
      setNotification({
        type: 'error',
        message: 'Hubo un problema al procesar el pago o el checkout fue cancelado. Puedes volver a intentarlo desde esta pantalla.',
      });
    }

    searchParams.delete('status');
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const fetchInvoices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        id,
        amount,
        currency,
        due_date,
        paid_at,
        status,
        radios (
          name
        )
      `)
      .order('due_date', { ascending: false });

    if (!error && data) {
      const formattedData = (data as any[]).map((item) => ({
        ...item,
        radio_name: item.radios?.name || 'Radio',
      }));
      setInvoices(formattedData);
    }
    setLoading(false);
  };

  const handlePayNow = async (invoice: Invoice) => {
    setProcessingId(invoice.id);

    try {
      const { data, error } = await supabase.functions.invoke('create-mp-preference', {
        body: {
          invoiceId: invoice.id,
          description: `Pago Factura - ${invoice.radio_name}`,
        },
      });

      if (error) throw error;

      if (data?.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error('No se pudo generar el link de pago');
      }
    } catch (error) {
      console.error('Error al procesar pago:', error);
      const message = error instanceof Error ? error.message : '';
      setNotification({
        type: 'error',
        message: message.includes('Authentication required')
          ? 'Tu sesion expiro. Vuelve a iniciar sesion para generar el link de pago.'
          : 'Hubo un error al generar el link de pago. Intenta de nuevo o contacta a soporte.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      paid: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      pending: 'bg-amber-50 text-amber-600 border-amber-100',
      overdue: 'bg-red-50 text-red-600 border-red-100',
      void: 'bg-gray-50 text-gray-600 border-gray-100',
    };

    return (
      <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase ${styles[status] || styles.void}`}>
        {status === 'paid' ? 'Pagado' : status === 'pending' ? 'Pendiente' : status === 'overdue' ? 'Vencido' : status}
      </span>
    );
  };

  return (
    <AdminLayout title="Historial de Pagos" subtitle="Mis facturas y comprobantes">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {notification && (
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                : notification.type === 'error'
                  ? 'bg-red-50 border-red-100 text-red-800'
                  : 'bg-blue-50 border-blue-100 text-blue-800'
            }`}
          >
            {notification.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />}
            {notification.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />}
            {notification.type === 'info' && <Info className="w-5 h-5 shrink-0 text-blue-500" />}
            <div className="flex-1">
              <p className="text-sm font-semibold">{notification.message}</p>
            </div>
          </div>
        )}

        <button onClick={() => navigate('/admin')} className="flex items-center space-x-2 text-[#697a8d] hover:text-[#696cff] transition-colors font-semibold text-sm sm:text-base">
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al panel</span>
        </button>

        <div className="bg-white dark:bg-[#2b2c40] rounded-xl shadow-sm border border-gray-100 dark:border-transparent overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-50 dark:border-[#444564] flex items-center space-x-3">
            <div className="p-2 bg-[#696cff]/10 rounded-lg">
              <History className="w-5 h-5 text-[#696cff]" />
            </div>
            <h2 className="text-lg font-bold text-[#566a7f] dark:text-[#cbcbe2]">Facturacion</h2>
          </div>

          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#696cff] animate-spin mb-4" />
              <p className="text-[#a1acb8]">Cargando...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="w-16 h-16 mx-auto text-gray-200 mb-4" />
              <p className="text-[#a1acb8] font-semibold">No tienes facturas pendientes ni pagadas.</p>
            </div>
          ) : (
            <>
              <div className="sm:hidden p-4 space-y-3">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="rounded-2xl border border-gray-100 dark:border-[#444564] bg-[#f9fafc] dark:bg-[#232333] p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#566a7f] dark:text-[#cbcbe2] truncate">{invoice.radio_name}</p>
                        <p className="text-xs text-[#a1acb8]">Vence {format(new Date(invoice.due_date), 'PPP', { locale: es })}</p>
                      </div>
                      {getStatusBadge(invoice.status)}
                    </div>

                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-[#a1acb8] font-bold">Monto</p>
                        <p className="text-lg font-bold text-[#696cff]">
                          {invoice.currency} {Number(invoice.amount).toLocaleString('es-AR')}
                        </p>
                      </div>

                      {(invoice.status === 'pending' || invoice.status === 'overdue') && (
                        <button
                          onClick={() => handlePayNow(invoice)}
                          disabled={processingId !== null}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#696cff] text-white text-[11px] font-bold uppercase rounded-lg hover:bg-[#5f61e6] transition-all disabled:opacity-50 shadow-sm shadow-[#696cff]/20"
                        >
                          {processingId === invoice.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 fill-current" />}
                          <span>Pagar</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-[#232333]/50 border-b border-gray-100 dark:border-[#444564]">
                    <tr>
                      <th className="p-4 text-xs font-bold uppercase text-[#566a7f] dark:text-[#cbcbe2]">Radio</th>
                      <th className="p-4 text-xs font-bold uppercase text-[#566a7f] dark:text-[#cbcbe2]">Vencimiento</th>
                      <th className="p-4 text-xs font-bold uppercase text-[#566a7f] dark:text-[#cbcbe2]">Monto</th>
                      <th className="p-4 text-xs font-bold uppercase text-[#566a7f] dark:text-[#cbcbe2]">Estado</th>
                      <th className="p-4 text-xs font-bold uppercase text-[#566a7f] dark:text-[#cbcbe2] text-center">Accion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-[#444564]">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-bold text-[#566a7f] dark:text-[#cbcbe2]">{invoice.radio_name}</td>
                        <td className="p-4 text-sm text-[#a1acb8]">{format(new Date(invoice.due_date), 'PPP', { locale: es })}</td>
                        <td className="p-4 font-bold text-[#696cff]">
                          {invoice.currency} {Number(invoice.amount).toLocaleString('es-AR')}
                        </td>
                        <td className="p-4">{getStatusBadge(invoice.status)}</td>
                        <td className="p-4 text-center">
                          {(invoice.status === 'pending' || invoice.status === 'overdue') && (
                            <button
                              onClick={() => handlePayNow(invoice)}
                              disabled={processingId !== null}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#696cff] text-white text-[10px] font-bold uppercase rounded-lg hover:bg-[#5f61e6] transition-all disabled:opacity-50 shadow-sm shadow-[#696cff]/20"
                            >
                              {processingId === invoice.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 fill-current" />}
                              <span>Pagar ahora</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
