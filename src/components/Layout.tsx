import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  CreditCard,
  Scale,
  Settings,
  Menu,
  X,
  Bell,
  RefreshCw,
  Moon,
  Sun,
  AlertTriangle,
  Info,
  AlertCircle,
  Check,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { actualizarDatosMacro } from '../utils/api';
import { formatARS, formatPorc } from '../utils/formatters';
import {
  calcularPatrimonioTotal,
  calcularRendimientoNominal,
} from '../utils/calculations';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/inversiones', label: 'Inversiones', icon: TrendingUp },
  { to: '/comparaciones', label: 'Comparaciones', icon: BarChart3 },
  { to: '/prestamo', label: 'Préstamo', icon: CreditCard },
  { to: '/benchmarks', label: 'Benchmarks', icon: Scale },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
];

function AlertPanel({ onClose }: { onClose: () => void }) {
  const { alertas, marcarAlertaLeida, limpiarAlertas } = useStore();

  const iconMap = {
    danger: <AlertCircle size={16} className="text-red-400 shrink-0" />,
    warning: <AlertTriangle size={16} className="text-amber-400 shrink-0" />,
    info: <Info size={16} className="text-blue-400 shrink-0" />,
  };

  return (
    <div className="absolute right-0 top-12 w-80 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <span className="text-sm font-semibold text-white">Alertas</span>
        <div className="flex items-center gap-2">
          {alertas.length > 0 && (
            <button
              onClick={limpiarAlertas}
              className="text-xs text-gray-500 hover:text-gray-300"
            >
              Limpiar
            </button>
          )}
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {alertas.length === 0 ? (
          <div className="p-6 text-center">
            <Check className="mx-auto text-emerald-400 mb-2" size={24} />
            <p className="text-sm text-gray-400">Sin alertas activas</p>
          </div>
        ) : (
          alertas.map((a) => (
            <div
              key={a.id}
              className={`px-4 py-3 border-b border-gray-800 last:border-0 cursor-pointer hover:bg-gray-800/50 ${
                a.leida ? 'opacity-50' : ''
              }`}
              onClick={() => marcarAlertaLeida(a.id)}
            >
              <div className="flex items-start gap-2">
                {iconMap[a.tipo]}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{a.titulo}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{a.descripcion}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(a.fecha).toLocaleDateString('es-AR')}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const navigate = useNavigate();

  const {
    inversiones,
    alertas,
    datosMacro,
    darkMode,
    toggleDarkMode,
    agregarAlerta,
    alertaConfig,
    macroConfig,
  } = useStore();

  const patrimonioTotal = calcularPatrimonioTotal(inversiones);
  const alertasNoLeidas = alertas.filter((a) => !a.leida).length;

  const handleRefresh = async () => {
    setRefreshing(true);
    const { dolar, inflacion, spy, spyPrecio } = await actualizarDatosMacro();

    const { datosMacro: dm, inversiones: invActualizadas } = useStore.getState();

    if (spy && spyPrecio) {
      const spyInv = invActualizadas.find((inv) => inv.ticker === 'SPY.BA');
      agregarAlerta({
        tipo: 'info',
        titulo: 'SPY.BA actualizado',
        descripcion: `Precio: $${spyPrecio.toFixed(0)} ARS/acción${spyInv ? ` · Total: $${spyInv.valorActual.toLocaleString('es-AR')}` : ''}`,
      });
    }
    if (dm.dolarMEP && dm.dolarMEP >= alertaConfig.dolarMEPUmbral) {
      agregarAlerta({
        tipo: 'warning',
        titulo: 'Dólar MEP sobre umbral',
        descripcion: `Dólar MEP en $${dm.dolarMEP.toFixed(0)}, supera umbral de $${alertaConfig.dolarMEPUmbral.toFixed(0)}`,
      });
    }
    if (
      dm.inflacionMensual &&
      dm.inflacionMensual * 100 >= alertaConfig.inflacionMensualUmbral
    ) {
      agregarAlerta({
        tipo: 'warning',
        titulo: 'Inflación mensual alta',
        descripcion: `Inflación mensual en ${formatPorc(dm.inflacionMensual)}, supera umbral de ${alertaConfig.inflacionMensualUmbral}%`,
      });
    }
    invActualizadas.forEach((inv) => {
      const rend = calcularRendimientoNominal(inv);
      if (alertaConfig.rendimientoNegativo && rend < 0) {
        agregarAlerta({
          tipo: 'danger',
          titulo: `Rendimiento negativo: ${inv.nombre}`,
          descripcion: `Rendimiento actual: ${formatPorc(rend)}`,
        });
      }
    });

    if (!dolar && !inflacion && !spy) {
      agregarAlerta({
        tipo: 'info',
        titulo: 'Sin conexión a APIs externas',
        descripcion: 'No se pudieron obtener datos actualizados. Verificá la conexión.',
      });
    }
    setRefreshing(false);
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen flex bg-gray-950 text-white">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-800 z-50 flex flex-col
            transform transition-transform duration-300
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0 lg:static lg:z-auto`}
        >
          {/* Logo */}
          <div className="p-5 border-b border-gray-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <TrendingUp size={14} className="text-white" />
                </div>
                <span className="text-base font-bold text-white">Finanzas AR</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 ml-9">Sistema de inversiones</p>
            </div>
            <button
              className="lg:hidden text-gray-500 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`
                }
              >
                <Icon size={17} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Bottom */}
          <div className="p-4 border-t border-gray-800">
            <div className="bg-gray-800/60 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Patrimonio Total</p>
              <p className="text-xl font-bold text-white">
                {formatARS(patrimonioTotal, true)}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                ≈ USD {((patrimonioTotal / (datosMacro.dolarMEP ?? macroConfig.dolarMEP))).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
              </p>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="sticky top-0 z-30 bg-gray-900/90 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden text-gray-400 hover:text-white p-1"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={20} />
              </button>
              <button
                className="lg:hidden flex items-center gap-1.5 text-white font-bold text-sm"
                onClick={() => navigate('/')}
              >
                <div className="w-5 h-5 bg-emerald-500 rounded flex items-center justify-center">
                  <TrendingUp size={11} className="text-white" />
                </div>
                Finanzas AR
              </button>
            </div>

            <div className="flex items-center gap-2">
              {datosMacro.dolarMEP && (
                <div className="hidden sm:flex items-center gap-1.5 bg-gray-800 rounded-lg px-3 py-1.5 text-xs">
                  <span className="text-gray-400">MEP</span>
                  <span className="font-bold text-white">
                    ${datosMacro.dolarMEP.toFixed(0)}
                  </span>
                </div>
              )}
              {datosMacro.inflacionMensual && (
                <div className="hidden md:flex items-center gap-1.5 bg-gray-800 rounded-lg px-3 py-1.5 text-xs">
                  <span className="text-gray-400">IPC</span>
                  <span className="font-bold text-amber-400">
                    {formatPorc(datosMacro.inflacionMensual)}
                  </span>
                </div>
              )}

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white px-3 py-1.5 rounded-lg text-xs transition-all"
              >
                <RefreshCw
                  size={13}
                  className={refreshing ? 'animate-spin' : ''}
                />
                <span className="hidden sm:inline">Actualizar</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setAlertsOpen((v) => !v)}
                  className="relative p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-all"
                >
                  <Bell size={17} />
                  {alertasNoLeidas > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                      {alertasNoLeidas > 9 ? '9+' : alertasNoLeidas}
                    </span>
                  )}
                </button>
                {alertsOpen && (
                  <AlertPanel onClose={() => setAlertsOpen(false)} />
                )}
              </div>

              <button
                onClick={toggleDarkMode}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-all"
              >
                {darkMode ? <Sun size={17} /> : <Moon size={17} />}
              </button>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-4 sm:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
