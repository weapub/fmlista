import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Search, 
  MessageCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MoreVertical,
  Filter,
  ExternalLink,
  Plus,
  Mail,
  Loader2,
  TrendingUp
} from 'lucide-react';
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
  const [searchTerm, setSearchSearchTerm] = useState('');
  const [isTriggering, setIsTriggering] = useState(false);
  const [summary, setSummary] = useState({ paid: 0, pending: 0 });

  useEffect(() => {
    fetchBillingData();
    fetchSummaryData();
  }, []);

  const fetchBillingData = async () => {
    setLoading(true);
    // En una implementación real, esto sería un join complejo o una vista en Supabase
    const { data, error } = await supabase
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
        email: item.radios?.contact_email || ''
      }));
      setRecords(formatted);
    }
    setLoading(false);
  };

  const fetchSummaryData = async () => {
    const { data, error } = await supabase
      .from('invoices')
      .select('amount, status');

    if (data) {
      const paid = data
        .filter(inv => inv.status === 'paid')
        .reduce((acc, inv) => acc + Number(inv.amount), 0);
      const pending = data
        .filter(inv => inv.status === 'pending' || inv.status === 'overdue')
        .reduce((acc, inv) => acc + Number(inv.amount), 0);
      setSummary({ paid, pending });
    }
  };

  const sendNotification = (record: BillingData) => {
    const date = format(new Date(record.next_billing), "dd 'de' MMMM", { locale: es });
    const message = `Hola *${record.radio_name}*, te recordamos que el pago de tu plan *${record.plan_name}* ($${record.amount}) vence el próximo *${date}*. Podés abonar desde tu panel o vía transferencia. ¡Gracias!`;
    
    window.open(`https://wa.me/${record.phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const createExtraInvoice = async (record: BillingData) => {
    const amount = prompt(`Monto extra para ${record.radio_name}:`);
    const notes = prompt(`Concepto (ej: Exceso de oyentes / Grabación extra):`);
    
    if (amount && notes) {
      const { error } = await supabase.from('invoices').insert({
        radio_id: record.radio_id,
        subscription_id: record.subscription_id,
        amount: parseFloat(amount),
        notes: notes,
        due_date: new Date().toISOString(),
        status: 'pending'
      });
      
      if (!error) {
        fetchSummaryData();
        alert('Cobro extra registrado correctamente.');
      }
    }
  };

  const handleManualTrigger = async () => {
    if (!confirm('¿Deseas enviar los recordatorios de vencimiento por email manualmente ahora?')) return;
    
    setIsTriggering(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-billing-reminders');
      if (error) throw error;
      
      alert(`Proceso completado. Recordatorios enviados: ${data?.processed || 0}`);
    } catch (err: any) {
      console.error('Error triggering reminders:', err);
      alert('Error al ejecutar el proceso: ' + err.message);
    } finally {
      setIsTriggering(false);
    }
  };

  const filteredRecords = records.filter(r => 
    r.radio_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-[#f5f5f9] min-h-screen dark:bg-[#232333]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#566a7f] dark:text-[#cbcbe2]">Gestión de Cobros</h1>
            <p className="text-[#a1acb8]">Control de suscripciones y facturación por emisora.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleManualTrigger}
              disabled={isTriggering}
              className="flex items-center gap-2 px-4 py-2 bg-[#696cff] text-white rounded-lg hover:bg-[#5f61e6] transition-all font-medium disabled:opacity-50 shadow-sm"
              title="Enviar recordatorios de email a todos los vencimientos próximos"
            >
              {isTriggering ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Ejecutar Recordatorios</span>
            </button>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a1acb8]" />
              <input 
                type="text"
                placeholder="Buscar radio o cliente..."
                className="pl-10 pr-4 py-2 bg-white dark:bg-[#2b2c40] border border-gray-200 dark:border-transparent rounded-lg w-full md:w-80 outline-none focus:border-[#696cff] transition-all"
                onChange={(e) => setSearchSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-[#2b2c40] p-6 rounded-xl shadow-sm border-l-4 border-emerald-500">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-[#a1acb8] font-medium uppercase tracking-wider">Recaudado (Total)</p>
                <h3 className="text-2xl font-bold text-[#566a7f] dark:text-[#cbcbe2]">
                  ${summary.paid.toLocaleString()}
                </h3>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#2b2c40] p-6 rounded-xl shadow-sm border-l-4 border-orange-500">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-500/10 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-[#a1acb8] font-medium uppercase tracking-wider">Pendiente de Pago</p>
                <h3 className="text-2xl font-bold text-[#566a7f] dark:text-[#cbcbe2]">
                  ${summary.pending.toLocaleString()}
                </h3>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#2b2c40] p-6 rounded-xl shadow-sm border-l-4 border-[#696cff]">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#696cff]/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-[#696cff]" />
              </div>
              <div>
                <p className="text-sm text-[#a1acb8] font-medium uppercase tracking-wider">Suscripciones Activas</p>
                <h3 className="text-2xl font-bold text-[#566a7f] dark:text-[#cbcbe2]">
                  {records.filter(r => r.status === 'active').length}
                </h3>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#2b2c40] rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f5f5f9]/50 dark:bg-[#232333]/50 border-b border-gray-100 dark:border-[#444564]">
                  <th className="p-4 text-xs font-bold uppercase text-[#566a7f] dark:text-[#cbcbe2]">Estación de Radio</th>
                  <th className="p-4 text-xs font-bold uppercase text-[#566a7f] dark:text-[#cbcbe2]">Plan Actual</th>
                  <th className="p-4 text-xs font-bold uppercase text-[#566a7f] dark:text-[#cbcbe2]">Vencimiento</th>
                  <th className="p-4 text-xs font-bold uppercase text-[#566a7f] dark:text-[#cbcbe2]">Estado</th>
                  <th className="p-4 text-xs font-bold uppercase text-[#566a7f] dark:text-[#cbcbe2]">Monto</th>
                  <th className="p-4 text-xs font-bold uppercase text-[#566a7f] dark:text-[#cbcbe2] text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-[#444564]">
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-[#a1acb8]">Cargando datos...</td></tr>
                ) : filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-[#323249] transition-colors">
                    <td className="p-4">
                      <span className="font-bold text-[#697a8d] dark:text-[#a3a4cc]">{record.radio_name}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm px-2 py-1 bg-[#696cff]/10 text-[#696cff] rounded-md font-medium">
                        {record.plan_name}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-[#697a8d] dark:text-[#a3a4cc]">
                          {format(new Date(record.next_billing), 'dd/MM/yyyy')}
                        </span>
                        <span className="text-[10px] text-[#a1acb8]">Facturación automática</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold",
                        record.status === 'active' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                      )}>
                        {record.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {record.status === 'active' ? 'Al día' : 'Vencido'}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-[#566a7f] dark:text-[#cbcbe2]">
                      ${record.amount.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => sendNotification(record)}
                          className="p-2 text-white bg-[#25D366] hover:bg-[#20bd5c] rounded-lg transition-colors title='Enviar Notificación WhatsApp'"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-[#696cff] bg-[#696cff]/10 hover:bg-[#696cff]/20 rounded-lg transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};