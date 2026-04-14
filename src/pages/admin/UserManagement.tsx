import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/components/AdminLayout';
import { ROLES, UserRole } from '@/types/auth';
import { User, Search, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserData {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setUsers(data);
    }
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setSavingId(userId);
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      showNotification('success', 'Rol actualizado correctamente');
    } catch (err: any) {
      showNotification('error', 'Error al actualizar el rol: ' + err.message);
    } finally {
      setSavingId(null);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout 
      title="Gestión de Usuarios" 
      subtitle="Administra los roles y permisos de los usuarios."
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {notification && (
          <div className={cn(
            "p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300",
            notification.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-red-50 border-red-100 text-red-800"
          )}>
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
            <p className="text-sm font-bold">{notification.message}</p>
          </div>
        )}

        <div className="bg-white dark:bg-[#2b2c40] rounded-xl shadow-sm border border-gray-100 dark:border-transparent overflow-hidden">
          <div className="p-6 border-b border-gray-50 dark:border-[#444564] flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-bold text-[#566a7f] dark:text-[#cbcbe2]">Usuarios Registrados</h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a1acb8]" />
              <input 
                type="text"
                placeholder="Buscar por email..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#232333] border border-gray-100 dark:border-[#444564] rounded-lg outline-none text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#696cff] animate-spin mb-2" />
                <p className="text-[#a1acb8] text-sm">Cargando usuarios...</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-[#232333]/50 border-b border-gray-100 dark:border-[#444564]">
                  <tr>
                    <th className="p-4 text-xs font-bold uppercase text-[#566a7f] dark:text-[#cbcbe2]">Usuario</th>
                    <th className="p-4 text-xs font-bold uppercase text-[#566a7f] dark:text-[#cbcbe2]">Rol Actual</th>
                    <th className="p-4 text-xs font-bold uppercase text-[#566a7f] dark:text-[#cbcbe2]">Fecha Registro</th>
                    <th className="p-4 text-xs font-bold uppercase text-[#566a7f] dark:text-[#cbcbe2] text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-[#444564]">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-[#323249] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#696cff]/10 rounded-lg flex items-center justify-center">
                            <User className="w-4 h-4 text-[#696cff]" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#566a7f] dark:text-[#cbcbe2]">{u.email}</p>
                            <p className="text-[10px] text-[#a1acb8]">ID: {u.id.slice(0,8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                          u.role === ROLES.SUPER_ADMIN ? "bg-purple-100 text-purple-600" :
                          u.role === ROLES.RADIO_ADMIN ? "bg-blue-100 text-blue-600" :
                          "bg-gray-100 text-gray-600"
                        )}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-[#a1acb8]">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <select
                            className="text-xs bg-white dark:bg-[#2b2c40] border border-gray-200 dark:border-[#444564] rounded px-2 py-1 outline-none"
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                            disabled={savingId === u.id}
                          >
                            <option value="listener">Oyente</option>
                            <option value="radio_admin">Radio Admin</option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                          {savingId === u.id && <Loader2 className="w-3 h-3 text-[#696cff] animate-spin" />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};