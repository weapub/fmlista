import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageCircle, Plus, Mail, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/components/AdminLayout';
import { cn } from '@/lib/utils';

interface BillingData {
  id: string;
  radio_name: string;
  plan_name: string;
  radio_id: string;
  subscription_id: string;
  next_billing: string;
  status: 'active' | 'past_due' | 'canceled';
  amount: number;
  phone: string;
  email: string;
}

export const BillingManagement: React.FC = () => {
  const [records, setRecords] = useState<BillingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isTriggering, setIsTriggering] = useState(false);
  const [summary, setSummary] = useState({ paid: 0, pending: 0 });

  useEffect(() => {
    fetchBillingData();
    fetchSummaryData();
  }, []);

  const fetchBillingData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('subscriptions')
      .select(`
        id,
        status,
        next_billing_date,
        radio_id,
        radios (name, contact_phone, contact_email),
        plans (name, price)
      `);

    if (data) {
      const formatted = data.map((item: any) => ({
        id: item.id,
        radio_id: item.radio_id,
        subscription_id: item.id,
        radio_name: item.radios?.name || 'N/A',
        plan_name: item.plans?.name || 'N/A',
        next_billing: item.next_billing_date,
        status: item.status,
        amount: item.plans?.price || 0,
        phone: item.radios?.contact_phone || '',
        email: item.radios?.contact_email || '',
      }));
      setRecords(formatted);
    }

    setLoading(false);
  };

  const fetchSummaryData = async () => {
    const { data } = await supabase.from('invoices').select('amount, status');

    if (data) {
      const paid = data
        .filter((invoice) => invoice.status === 'paid')
        .reduce((acc, invoice) => acc + Number(invoice.amount), 0);
      const pending = data
        .filter((invoice) => invoice.status === 'pending' || invoice.status === 'overdue')
        .reduce((acc, invoice) => acc + Number(invoice.amount), 0);
      setSummary({ paid, pending });
    }
  };

  const sendNotification = (record: BillingData) => {
    const date = format(new Date(record.next_billing), "dd 'de' MMMM", { locale: es });
    const message = `Hola *${record.radio_name}*, te recordamos que el pago de tu plan *${record.plan_name}* ($${record.amount}) vence el proximo *${date}*. Podes abonarlo desde tu panel o via transferencia. Gracias.`;
    window.open(`https://wa.me/${record.phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const createExtraInvoice = async (record: BillingData) => {
    const amount = prompt(`Monto extra para ${record.radio_name}:`);
    const notes = prompt('Concepto (por ejemplo: exceso de oyentes o grabacion extra):');

    if (amount && notes) {
      const { error } = await supabase.from('invoices').insert({
        radio_id: record.radio_id,
        subscription_id: record.subscription_id,
        amount: parseFloat(amount),
        notes,
        due_date: new Date().toISOString(),
        status: 'pending',
      });

      if (!error) {
        fetchSummaryData();
        alert('Cobro extra registrado correctamente.');
      }
    }
  };

  const handleManualTrigger = async () => {
    if (!confirm('Deseas enviar los recordatorios de vencimiento por email manualmente ahora?')) return;

    setIsTriggering(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-billing-reminders', {
        body: { force: true, daysAhead: 7 },
      });
      if (error) throw error;
      alert(`Proceso completado. Enviados: ${data?.sent || 0}. Omitidos: ${data?.skipped || 0}.`);
    } catch (error: any) {
      const message = error?.message?.includes('Failed to send a request to the Edge Function')
        ? 'No pudimos contactar la funcion send-billing-reminders. Revisa si esta desplegada y si existen los secrets RESEND_API_KEY y BILLING_FROM_EMAIL.'
        : error.message;
      alert(`Error al ejecutar el proceso: ${message}`);
    } finally {
      setIsTriggering(false);
    }
  };

  const filteredRecords = records.filter((record) =>
    record.radio_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout title="Gestion de Cobros" subtitle="Control de suscripciones y facturacion">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#566a7f] dark:text-[#cbcbe2]">Gestion de Cobros</h2>
            <p className="text-sm sm:text-base text-[#a1acb8]">Control de suscripciones y facturacion.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleManualTrigger}
              disabled={isTriggering}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[#696cff] text-white rounded-xl hover:bg-[#5f61e6] transition-all disabled:opacity-50"
            >
              {isTriggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              <span>Recordatorios</span>
            </button>
            <input
              type="text"
              placeholder="Buscar radio..."
              className="w-full sm:w-64 pl-4 pr-4 py-3 bg-white dark:bg-[#2b2c40] border border-gray-200 dark:border-[#444564] rounded-xl outline-none"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-[#2b2c40] p-5 sm:p-6 rounded-xl shadow-sm border-l-4 border-emerald-500">
            <p className="text-sm text-[#a1acb8] font-medium uppercase">Recaudado</p>
            <h3 className="text-2xl font-bold text-[#566a7f] dark:text-[#cbcbe2]">${summary.paid.toLocaleString()}</h3>
          </div>
          <div className="bg-white dark:bg-[#2b2c40] p-5 sm:p-6 rounded-xl shadow-sm border-l-4 border-orange-500">
            <p className="text-sm text-[#a1acb8] font-medium uppercase">Pendiente</p>
            <h3 className="text-2xl font-bold text-[#566a7f] dark:text-[#cbcbe2]">${summary.pending.toLocaleString()}</h3>
          </div>
          <div className="bg-white dark:bg-[#2b2c40] p-5 sm:p-6 rounded-xl shadow-sm border-l-4 border-[#696cff]">
            <p className="text-sm text-[#a1acb8] font-medium uppercase">Activas</p>
            <h3 className="text-2xl font-bold text-[#566a7f] dark:text-[#cbcbe2]">{records.filter((record) => record.status === 'active').length}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-[#2b2c40] rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#696cff]" />
            </div>
          ) : (
            <>
              <div className="sm:hidden p-4 space-y-3">
                {filteredRecords.map((record) => (
                  <div key={record.id} className="rounded-2xl border border-gray-100 dark:border-[#444564] bg-[#f9fafc] dark:bg-[#232333] p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#697a8d] dark:text-[#cbcbe2] truncate">{record.radio_name}</p>
                        <p className="text-xs text-[#a1acb8]">{record.plan_name}</p>
                      </div>
                      <span
                        className={cn(
                          'px-2 py-1 rounded-full text-[10px] font-bold',
                          record.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                        )}
                      >
                        {record.status === 'active' ? 'Al dia' : 'Vencido'}
                      </span>
                    </div>

                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-[#a1acb8] font-bold">Vencimiento</p>
                        <p className="text-sm font-semibold text-[#566a7f] dark:text-[#cbcbe2]">{format(new Date(record.next_billing), 'dd/MM/yyyy')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] uppercase tracking-wide text-[#a1acb8] font-bold">Monto</p>
                        <p className="text-lg font-bold text-[#566a7f] dark:text-[#cbcbe2]">${record.amount.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => sendNotification(record)} className="flex items-center justify-center gap-2 p-3 text-white bg-[#25D366] rounded-xl">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Avisar</span>
                      </button>
                      <button onClick={() => createExtraInvoice(record)} className="flex items-center justify-center gap-2 p-3 text-orange-500 bg-orange-100 rounded-xl">
                        <Plus className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Extra</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#f5f5f9]/50 dark:bg-[#232333]/50 border-b">
                    <tr>
                      <th className="p-4 text-xs font-bold uppercase text-[#566a7f]">Radio</th>
                      <th className="p-4 text-xs font-bold uppercase text-[#566a7f]">Plan</th>
                      <th className="p-4 text-xs font-bold uppercase text-[#566a7f]">Vencimiento</th>
                      <th className="p-4 text-xs font-bold uppercase text-[#566a7f]">Estado</th>
                      <th className="p-4 text-xs font-bold uppercase text-[#566a7f]">Monto</th>
                      <th className="p-4 text-xs font-bold uppercase text-[#566a7f] text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-[#323249]">
                        <td className="p-4 font-bold text-[#697a8d]">{record.radio_name}</td>
                        <td className="p-4 text-sm">{record.plan_name}</td>
                        <td className="p-4 text-sm">{format(new Date(record.next_billing), 'dd/MM/yyyy')}</td>
                        <td className="p-4">
                          <span
                            className={cn(
                              'px-2 py-1 rounded-full text-xs font-bold',
                              record.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                            )}
                          >
                            {record.status === 'active' ? 'Al dia' : 'Vencido'}
                          </span>
                        </td>
                        <td className="p-4 font-bold">${record.amount.toLocaleString()}</td>
                        <td className="p-4">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => sendNotification(record)} className="p-2 text-white bg-[#25D366] rounded-lg">
                              <MessageCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => createExtraInvoice(record)} className="p-2 text-orange-500 bg-orange-100 rounded-lg">
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
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
