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
    const { data } = await supabase
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
            <p className="text-[#a1acb8]">Control de suscripciones y facturación.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleManualTrigger}
              disabled={isTriggering}
              className="flex items-center gap-2 px-4 py-2 bg-[#696cff] text-white rounded-lg hover:bg-[#5f61e6] transition-all disabled:opacity-50"
            >
              {isTriggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              <span>Recordatorios</span>
            </button>
            <input 
              type="text"
              placeholder="Buscar..."
              className="pl-4 pr-4 py-2 bg-white dark:bg-[#2b2c40] border rounded-lg outline-none"
              onChange={(e) => setSearchSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-[#2b2c40] p-6 rounded-xl shadow-sm border-l-4 border-emerald-500">
            <p className="text-sm text-[#a1acb8] font-medium uppercase">Recaudado</p>
            <h3 className="text-2xl font-bold text-[#566a7f] dark:text-[#cbcbe2]">${summary.paid.toLocaleString()}</h3>
          </div>
          <div className="bg-white dark:bg-[#2b2c40] p-6 rounded-xl shadow-sm border-l-4 border-orange-500">
            <p className="text-sm text-[#a1acb8] font-medium uppercase">Pendiente</p>
            <h3 className="text-2xl font-bold text-[#566a7f] dark:text-[#cbcbe2]">${summary.pending.toLocaleString()}</h3>
          </div>
          <div className="bg-white dark:bg-[#2b2c40] p-6 rounded-xl shadow-sm border-l-4 border-[#696cff]">
            <p className="text-sm text-[#a1acb8] font-medium uppercase">Activas</p>
            <h3 className="text-2xl font-bold text-[#566a7f] dark:text-[#cbcbe2]">{records.filter(r => r.status === 'active').length}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-[#2b2c40] rounded-xl shadow-sm overflow-hidden">
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
                    <span className={cn("px-2 py-1 rounded-full text-xs font-bold", record.status === 'active' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600")}>
                      {record.status === 'active' ? 'Al día' : 'Vencido'}
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
      </div>
    </div>
  );
};
