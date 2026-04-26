import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Settings,
  Radio,
  Users,
  CreditCard,
  History,
  Megaphone,
  FolderOpen,
  LogOut,
  ChevronRight,
  Search,
  Moon,
  Sun,
  Menu,
  X,
  ExternalLink,
  PlaySquare,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';
import { ROLES } from '@/types/auth';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  pattern: RegExp;
  superAdminOnly?: boolean;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title,
  subtitle,
  searchPlaceholder = 'Buscar en el panel...',
  searchValue = '',
  onSearchChange,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuthStore();
  const { isDark, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;

  const menuItems: MenuItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin', pattern: /^\/admin$/ },
    { icon: Radio, label: 'Mis Emisoras', path: '/admin', pattern: /^\/admin(\/profile|\/schedule|$)/ },
    { icon: History, label: 'Pagos', path: '/admin/payments', pattern: /^\/admin\/payments$/ },
    { icon: Megaphone, label: 'Anuncios', path: '/admin/anuncios', pattern: /^\/admin\/anuncios(\/.*)?$/ },
    { icon: CreditCard, label: 'Cobros', path: '/admin/billing', pattern: /^\/admin\/billing$/, superAdminOnly: true },
    { icon: PlaySquare, label: 'Programas', path: '/admin/programas', pattern: /^\/admin\/programas$/, superAdminOnly: true },
    { icon: FolderOpen, label: 'Catalogo', path: '/admin/catalogo', pattern: /^\/admin\/catalogo$/, superAdminOnly: true },
    { icon: Users, label: 'Usuarios', path: '/admin/users', pattern: /^\/admin\/users$/, superAdminOnly: true },
    { icon: Settings, label: 'Planes', path: '/admin/planes', pattern: /^\/admin\/planes$/, superAdminOnly: true },
    { icon: Settings, label: 'Configuracion', path: '/admin/settings', pattern: /^\/admin\/settings$/, superAdminOnly: true },
  ];

  const visibleMenuItems = useMemo(
    () => menuItems.filter((item) => !item.superAdminOnly || isSuperAdmin),
    [isSuperAdmin]
  );

  const mobileQuickItems = visibleMenuItems.slice(0, 4);
  const displayName = user?.email?.split('@')[0] || 'Administrador';
  const roleLabel = isSuperAdmin ? 'Super Admin' : 'Radio Admin';
  const avatarInitial = displayName.charAt(0).toUpperCase() || 'A';

  const handleLogout = async () => {
    await signOut();
    setIsMobileMenuOpen(false);
    navigate('/login');
  };

  const handleNavigate = (path: string) => {
    setIsMobileMenuOpen(false);
    navigate(path);
  };

  const renderMenuLinks = (compact = false) =>
    visibleMenuItems.map((item) => {
      const isActive = item.pattern.test(location.pathname);
      return (
        <button
          key={item.label}
          type="button"
          onClick={() => handleNavigate(item.path)}
          className={`flex w-full items-center justify-between rounded-xl transition-all duration-200 group ${
            compact ? 'px-3 py-3' : 'px-4 py-3'
          } ${
            isActive
              ? 'bg-[#696cff] text-white shadow-md shadow-[#696cff]/30 font-semibold'
              : 'text-[#697a8d] dark:text-[#a3a4cc] hover:bg-[#f5f5f9] dark:hover:bg-[#323249]'
          }`}
        >
          <div className="flex items-center space-x-3">
            <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#697a8d] group-hover:text-[#696cff]'}`} />
            <span className={compact ? 'text-sm' : ''}>{item.label}</span>
          </div>
          {isActive && <ChevronRight className="w-4 h-4 opacity-50" />}
        </button>
      );
    });

  return (
    <div className="min-h-screen bg-[#f5f5f9] dark:bg-[#232333] flex transition-colors duration-300">
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menu"
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
          />
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-xs bg-white dark:bg-[#2b2c40] shadow-2xl flex flex-col">
            <div className="p-5 border-b border-gray-100 dark:border-[#444564] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#696cff] rounded-xl shadow-sm shadow-[#696cff]/30 flex items-center justify-center">
                  <Radio className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-[#566a7f] dark:text-[#cbcbe2]">Admin Panel</p>
                  <p className="text-xs text-[#a1acb8] dark:text-[#7e7e9a]">{roleLabel}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg text-[#697a8d] dark:text-[#a3a4cc] hover:bg-gray-100 dark:hover:bg-[#323249]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 py-4">
              <div className="flex items-center gap-3 rounded-2xl bg-[#f5f5f9] dark:bg-[#232333] p-3">
                <div className="w-11 h-11 rounded-full bg-[#696cff] flex items-center justify-center text-white font-bold shadow-sm shadow-[#696cff]/20">
                  {avatarInitial}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#566a7f] dark:text-[#cbcbe2] truncate">{displayName}</p>
                  <p className="text-xs text-[#a1acb8] dark:text-[#7e7e9a]">{user?.email}</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 px-4 pb-4 space-y-2 overflow-y-auto">{renderMenuLinks(true)}</nav>

            <div className="p-4 border-t border-gray-100 dark:border-[#444564] space-y-2">
              <a
                href="/"
                className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl text-[#697a8d] dark:text-[#a3a4cc] hover:bg-[#f5f5f9] dark:hover:bg-[#323249] transition-colors font-medium"
              >
                <ExternalLink className="w-5 h-5" />
                <span>Ir al sitio</span>
              </a>
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl text-[#697a8d] dark:text-[#a3a4cc] hover:bg-[#f5f5f9] dark:hover:bg-[#323249] transition-colors font-medium"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                <span>{isDark ? 'Tema claro' : 'Tema oscuro'}</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center space-x-3 px-4 py-3 w-full text-[#ff3e1d] hover:bg-[#ff3e1d]/10 rounded-xl transition-colors font-medium"
              >
                <LogOut className="w-5 h-5" />
                <span>Cerrar sesion</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <aside className="w-64 bg-white dark:bg-[#2b2c40] hidden lg:flex flex-col border-r border-gray-100 dark:border-transparent sticky top-0 h-screen transition-colors duration-300">
        <div className="p-6 flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-[#696cff] rounded-lg shadow-sm shadow-[#696cff]/30 flex items-center justify-center">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-[#566a7f] dark:text-[#cbcbe2] text-xl">Admin Panel</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {visibleMenuItems.map((item) => {
            const isActive = item.pattern.test(location.pathname);
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-[#696cff] text-white shadow-md shadow-[#696cff]/30 font-semibold'
                    : 'text-[#697a8d] dark:text-[#a3a4cc] hover:bg-[#f5f5f9] dark:hover:bg-[#323249]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#697a8d] group-hover:text-[#696cff]'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 opacity-50" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-[#444564]">
          <a
            href="/"
            className="mb-2 flex items-center space-x-3 px-4 py-2.5 w-full rounded-lg text-[#697a8d] dark:text-[#a3a4cc] hover:bg-[#f5f5f9] dark:hover:bg-[#323249] transition-colors font-medium"
          >
            <ExternalLink className="w-5 h-5" />
            <span>Ir al sitio</span>
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-2.5 w-full text-[#ff3e1d] hover:bg-[#ff3e1d]/10 rounded-lg transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar sesion</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
        <header className="bg-white/90 dark:bg-[#2b2c40]/90 min-h-20 border-b border-gray-100 dark:border-transparent sticky top-0 z-30 backdrop-blur-sm px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3 transition-colors duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-[#f5f5f9] dark:bg-[#232333] text-[#697a8d] dark:text-[#a3a4cc]"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-[#566a7f] dark:text-[#cbcbe2] truncate">{title}</h1>
              {subtitle && (
                <p className="text-[11px] sm:text-xs text-[#a1acb8] dark:text-[#7e7e9a] uppercase tracking-wider font-semibold truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex-1 max-w-md mx-2 lg:mx-8 hidden md:block">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a1acb8] dark:text-[#7e7e9a] group-focus-within:text-[#696cff] transition-colors" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(event) => onSearchChange?.(event.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#f5f5f9] dark:bg-[#232333] border border-transparent dark:border-transparent rounded-lg focus:bg-white dark:focus:bg-[#323249] focus:border-[#696cff] focus:ring-[0.25rem] focus:ring-[#696cff]/10 transition-all outline-none text-sm text-[#566a7f] dark:text-[#cbcbe2] placeholder:text-[#b4bdc6] dark:placeholder:text-[#4e4e6a]"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
            <a
              href="/"
              className="hidden sm:flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#697a8d] hover:bg-gray-100 dark:text-[#a3a4cc] dark:hover:bg-[#323249] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Ver sitio</span>
            </a>
            <button onClick={toggleTheme} className="p-2 rounded-lg text-[#697a8d] dark:text-[#a3a4cc] hover:bg-gray-100 dark:hover:bg-[#323249] transition-colors">
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-sm font-semibold text-[#566a7f] dark:text-[#cbcbe2]">{displayName}</span>
              <span className="text-xs text-[#a1acb8] dark:text-[#7e7e9a]">{roleLabel}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#696cff] flex items-center justify-center text-white font-bold shadow-sm shadow-[#696cff]/20">
              {avatarInitial}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-5rem)]">{children}</main>

        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-gray-200 dark:border-[#444564] bg-white/95 dark:bg-[#2b2c40]/95 backdrop-blur-xl">
          <div className="grid grid-cols-4 gap-1 px-2 py-2">
            {mobileQuickItems.map((item) => {
              const isActive = item.pattern.test(location.pathname);
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleNavigate(item.path)}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 ${
                    isActive ? 'text-[#696cff] bg-[#696cff]/10' : 'text-[#697a8d] dark:text-[#a3a4cc]'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-[10px] font-semibold leading-none">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
};
