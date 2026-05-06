import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Store, 
  TrendingUp as ShowChart, 
  ShieldAlert as AdminPanelSettings,
  MapPin as LocationOn,
  Search,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Share2,
  RefreshCw,
  Terminal,
  Database,
  Download,
  Eraser as DeleteSweep,
  History,
  Activity,
  Lock,
  X,
  LogOut,
  CheckSquare,
  PlusCircle,
  Plus,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

// Types
interface PriceItem {
  id: string;
  name: string;
  price: number;
  change: number;
  unit: string;
  category: string;
  market: string;
  lastUpdate: string;
}

interface AppStats {
  ingestedToday: number;
  changeFromYesterday: number;
  quotaUsed: number;
  quotaMax: number;
  serverHealth: {
    cpu: number;
    memory: number;
    latency: number;
  }
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'High' | 'Medium' | 'Low';
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState('Malang Raya');

  // Admin Protection State
  const [tapCount, setTapCount] = useState(0);
  const [lastTap, setLastTap] = useState(0);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    fetchData(userLocation);
  }, [userLocation]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=12`);
          const data = await response.json();
          // Priority: City -> State District (Regency) -> Municipality -> Town
          const city = data.address.city || 
                       data.address.state_district || 
                       data.address.municipality || 
                       data.address.city_district || 
                       data.address.town || 
                       'Malang Raya';
          setUserLocation(city);
        } catch (error) {
          console.error("Location fetch error:", error);
        }
      }, (error) => {
        console.error("Geolocation error:", error);
      }, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });
    }
  }, []);

  const handleHeaderClick = () => {
    const now = Date.now();
    // Jika jeda antar ketukan terlalu lama (> 1 detik), reset hitungan
    if (now - lastTap > 1000) {
      setTapCount(1);
      setLastTap(now);
      return;
    }

    const newCount = tapCount + 1;
    setTapCount(newCount);
    setLastTap(now);

    if (newCount >= 3) {
      setShowPasswordPrompt(true);
      setTapCount(0);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'harg4Ngalam!') {
      setIsAuthenticated(true);
      setShowPasswordPrompt(false);
      setLoginError('');
      setPassword('');
      setActiveTab('admin');
    } else {
      setLoginError('Kata sandi salah!');
    }
  };

  const fetchData = async (region: string = 'Malang Raya') => {
    try {
      setLoading(true);
      const [priceRes, statsRes] = await Promise.all([
        fetch(`/api/prices?region=${encodeURIComponent(region)}`),
        fetch('/api/stats')
      ]);
      const priceData = await priceRes.json();
      const statsData = await statsRes.json();
      
      setPrices(priceData.data);
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] font-sans pb-24">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full bg-white z-40 border-b border-[#e2e8f0] py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer select-none active:opacity-70 transition-opacity"
            onClick={handleHeaderClick}
          >
            <LocationOn size={24} className="text-[#004532]" />
            <h1 className="text-xl font-bold text-[#004532] tracking-tight">Hargapangan</h1>
          </div>
          <button className="p-1 hover:bg-slate-100 rounded-full transition-colors">
            <Search size={24} className="text-[#004532]" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 px-4 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && <HomeView prices={prices} loading={loading} onSeeReport={() => setActiveTab('trends')} userLocation={userLocation} />}
          {activeTab === 'catalog' && <CatalogView prices={prices} loading={loading} userLocation={userLocation} />}
          {activeTab === 'tasks' && <TasksView />}
          {activeTab === 'trends' && <TrendsView prices={prices} />}
          {activeTab === 'admin' && (
            <AdminView 
              stats={stats} 
              prices={prices}
              fetchData={fetchData} 
              userLocation={userLocation}
              onLogout={() => {
                setIsAuthenticated(false);
                setActiveTab('home');
              }}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-[#e2e8f0] z-50 flex justify-around py-3">
        <NavButton 
          active={activeTab === 'home'} 
          icon={<Home size={22} />} 
          label="Home" 
          onClick={() => setActiveTab('home')} 
        />
        <NavButton 
          active={activeTab === 'catalog'} 
          icon={<Store size={22} />} 
          label="Catalog" 
          onClick={() => setActiveTab('catalog')} 
        />
        {isAuthenticated && (
          <>
            <NavButton 
              active={activeTab === 'tasks'} 
              icon={<CheckSquare size={22} />} 
              label="Tasks" 
              onClick={() => setActiveTab('tasks')} 
            />
            <NavButton 
              active={activeTab === 'admin'} 
              icon={<AdminPanelSettings size={22} />} 
              label="Admin" 
              onClick={() => setActiveTab('admin')} 
            />
          </>
        )}
        <NavButton 
          active={activeTab === 'trends'} 
          icon={<ShowChart size={22} />} 
          label="Trends" 
          onClick={() => setActiveTab('trends')} 
        />
      </nav>

      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordPrompt && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0b1c30]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="bg-emerald-50 p-3 rounded-2xl text-[#004532]">
                  <Lock size={24} />
                </div>
                <button 
                  onClick={() => {
                    setShowPasswordPrompt(false);
                    setLoginError('');
                    setPassword('');
                  }}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <h3 className="text-xl font-bold text-slate-800">Akses Terbatas</h3>
              <p className="text-sm text-slate-500 mt-1">Masukkan kata sandi untuk membuka fitur pengembang.</p>

              <form onSubmit={handleLogin} className="mt-6 space-y-4">
                <div>
                  <input 
                    autoFocus
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Kata Sandi"
                    className={`w-full bg-slate-50 border ${loginError ? 'border-red-300' : 'border-slate-200'} rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-[#004532] transition-colors`}
                  />
                  {loginError && <p className="text-[10px] font-bold text-red-500 mt-2 ml-1">{loginError}</p>}
                </div>
                <button 
                  type="submit"
                  className="w-full bg-[#004532] text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-emerald-900/20 active:scale-[0.98] transition-transform"
                >
                  Buka Akses
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all duration-200 ${
        active ? 'text-[#004532]' : 'text-slate-400 opacity-70'
      }`}
    >
      <div className={`p-1 rounded-xl ${active ? 'bg-[#004532]/10' : ''}`}>
        {icon}
      </div>
      <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
    </button>
  );
}

// --- Views ---

function HomeView({ prices, loading, onSeeReport, userLocation }: { prices: PriceItem[], loading: boolean, onSeeReport: () => void, userLocation: string }) {
  const featured = prices.slice(0, 4);
  const chartData = [
    { day: 'Sen', price: 15400 },
    { day: 'Sel', price: 16000 },
    { day: 'Rab', price: 15800 },
    { day: 'Kam', price: 16200 },
    { day: 'Jum', price: 16800 },
    { day: 'Sab', price: 16600 },
    { day: 'Min', price: 16450 },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      <section>
        <h2 className="text-3xl font-bold text-slate-900 leading-tight">
          Pasar <span className="text-[#004532] underline decoration-emerald-200 underline-offset-4">{userLocation}</span>
        </h2>
        <p className="text-slate-500 mt-1">Pantau harga pangan strategis hari ini secara akurat.</p>
        
        <div className="mt-4 bg-white border border-[#e2e8f0] px-4 py-3 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#004532] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#004532]"></span>
            </div>
            <span className="text-xs font-medium text-slate-600">Data Terupdate: Realtime (5 menit yang lalu)</span>
          </div>
          <ChevronRight size={16} className="text-slate-300" />
        </div>
      </section>

      {/* Grid Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white border border-[#e2e8f0] p-4 rounded-2xl h-32 animate-pulse" />
          ))
        ) : (
          featured.map((item) => (
            <div key={item.id} className="bg-white border border-[#e2e8f0] p-4 rounded-2xl flex flex-col justify-between hover:shadow-sm transition-shadow">
              <div className="flex justify-between items-start">
                <div className="bg-[#a6f2d1] p-2.5 rounded-xl text-[#004532]">
                  <Store size={20} />
                </div>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  item.change >= 0 ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {item.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {item.change >= 0 ? `+Rp ${item.change}` : `-Rp ${Math.abs(item.change)}`}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{item.name}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold text-[#006591]">Rp {item.price.toLocaleString('id-ID')}</span>
                  <span className="text-xs text-slate-400">/{item.unit}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Chart Section */}
      <section className="bg-white border border-[#e2e8f0] p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">Tren Rata-rata Mingguan</h3>
          <div className="flex gap-1 bg-slate-50 p-1 rounded-xl">
            <button className="px-3 py-1 bg-white shadow-sm rounded-lg text-xs font-bold text-[#004532]">Gabungan</button>
            <button className="px-3 py-1 text-xs font-medium text-slate-400">Detail</button>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#006591" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#006591" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 10, fill: '#94a3b8'}} 
                dy={10}
              />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke="#006591" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorPrice)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Info Hero */}
      <section className="bg-[#004532] text-white p-8 rounded-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-sm">
          <h3 className="text-xl font-bold">Info {userLocation}</h3>
          <p className="mt-3 text-emerald-100 opacity-90 leading-relaxed text-sm">
            Pasar induk Gadang melaporkan ketersediaan stok beras aman untuk 3 bulan ke depan.
          </p>
          <button 
            onClick={onSeeReport}
            className="mt-6 bg-white text-[#004532] px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-emerald-50 transition-colors"
          >
            Lihat Laporan Lengkap
          </button>
        </div>
        <div className="absolute -right-12 -bottom-12 opacity-10">
          <ShowChart size={180} />
        </div>
      </section>

      {/* Source & Disclaimer */}
      <section className="bg-slate-50 border border-slate-100 p-6 rounded-2xl">
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sumber Data</p>
            <p className="text-xs text-slate-600 font-medium">PIHPS Nasional, Siskaperbapo Jatim, & Survei Harian Pasar Lokal {userLocation}.</p>
          </div>
          <div className="h-px bg-slate-200/50" />
          <div>
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Disclaimer</p>
            <p className="text-xs text-slate-500 leading-relaxed italic">
              Data harga berfluktuasi secara dinamis di masing-masing pasar berdasarkan ketersediaan stok dan waktu pengambilan data. Harga bersifat referensi.
            </p>
          </div>
        </div>
      </section>

      {/* Credit Section */}
      <section className="text-center pt-8 border-t border-slate-100">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Dikembangkan Oleh</p>
        <h4 className="text-xl font-bold text-[#004532] mt-1">M Nasri AW</h4>
        <p className="text-xs text-slate-400 mt-2">© 2024 Hargapangan {userLocation}. Semua hak dilindungi.</p>
      </section>
    </motion.div>
  );
}

function CatalogView({ prices, loading, userLocation }: { prices: PriceItem[], loading: boolean, userLocation: string }) {
  const [filter, setFilter] = useState('Semua');
  const categories = ['Semua', 'Beras', 'Minyak', 'Daging', 'Hortikultura', 'Ikan'];

  const filteredPrices = filter === 'Semua' 
    ? prices 
    : prices.filter(p => p.category === filter);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <section>
        <h2 className="text-2xl font-bold text-[#004532]">Katalog Komoditas</h2>
        <p className="text-slate-500 text-sm mt-1">Pantau harga bahan pokok dari berbagai pasar di {userLocation}.</p>
      </section>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`px-6 py-2 content-center whitespace-nowrap rounded-2xl text-xs font-bold transition-all ${
              filter === c 
                ? 'bg-[#004532] text-white shadow-md' 
                : 'bg-white border border-[#e2e8f0] text-slate-500 hover:border-emerald-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-white border border-[#e2e8f0] p-4 rounded-2xl h-24 animate-pulse" />
          ))
        ) : (
          filteredPrices.map(item => (
            <div key={item.id} className="bg-white border border-[#e2e8f0] p-5 rounded-2xl flex items-center justify-between group">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800">{item.name}</h3>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg">{item.market}</span>
                </div>
                <div className="mt-3 flex items-baseline gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Harga Per {item.unit}</p>
                    <p className="text-lg font-bold text-[#006591]">Rp {item.price.toLocaleString('id-ID')}</p>
                  </div>
                  <div className={`flex items-center gap-1 text-[10px] font-bold ${
                    item.change >= 0 ? 'text-red-500' : 'text-emerald-500'
                  }`}>
                    {item.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {item.change >= 0 ? `+${item.change}` : item.change}
                  </div>
                </div>
              </div>
              <div className="bg-emerald-50 p-3 rounded-2xl text-[#004532] group-hover:bg-emerald-100 transition-colors">
                <ChevronRight size={20} />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-[#eff4ff] p-6 rounded-2xl border border-[#dce9ff] flex flex-col md:flex-row items-center gap-4">
        <div className="bg-[#006591] p-3 rounded-full text-white shadow-lg">
          <Activity size={24} />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h4 className="font-bold text-slate-800 tracking-tight">Pasang Peringatan Harga</h4>
          <p className="text-sm text-slate-500 mt-1">Notifikasi instan saat harga komoditas pilihan Anda turun.</p>
        </div>
        <button className="bg-[#004532] text-white px-8 py-3 rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-transform w-full md:w-auto">
          Aktifkan Sekarang
        </button>
      </div>
    </motion.div>
  );
}

function TrendsView({ prices }: { prices: PriceItem[] }) {
  const topGainers = [...prices].sort((a, b) => b.change - a.change).slice(0, 3);
  const topLosers = [...prices].sort((a, b) => a.change - b.change).slice(0, 3);

  const historicalData = [
    { name: '01 Mei', beras: 12100, minyak: 16000, daging: 112000 },
    { name: '02 Mei', beras: 12200, minyak: 16200, daging: 113000 },
    { name: '03 Mei', beras: 12500, minyak: 16100, daging: 115000 },
    { name: '04 Mei', beras: 12400, minyak: 16500, daging: 114000 },
    { name: '05 Mei', beras: 12500, minyak: 16400, daging: 115000 },
    { name: '06 Mei', beras: 12800, minyak: 16800, daging: 116000 },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.98 }}
      className="space-y-8 pb-12"
    >
      <section>
        <h2 className="text-2xl font-bold text-[#004532]">Tren & Analisis</h2>
        <p className="text-slate-500 text-sm mt-1">Analisis visual pergerakan harga pangan strategis.</p>
      </section>

      {/* Volatility Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-[#e2e8f0] p-6 rounded-3xl shadow-sm">
          <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <TrendingUp size={14} />
            Lonjakan Tertinggi
          </h4>
          <div className="space-y-4">
            {topGainers.map(item => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">{item.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{item.market}</p>
                </div>
                <span className="text-xs font-bold text-red-500">+{item.change.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#e2e8f0] p-6 rounded-3xl shadow-sm">
          <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <TrendingDown size={14} />
            Penurunan Tertinggi
          </h4>
          <div className="space-y-4">
            {topLosers.map(item => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">{item.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{item.market}</p>
                </div>
                <span className="text-xs font-bold text-emerald-500">{item.change.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Historical Chart */}
      <section className="bg-white border border-[#e2e8f0] p-6 rounded-3xl shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-bold text-slate-800">Histori 7 Hari Terakhir</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Perbandingan komoditas utama (Rata-rata)</p>
          </div>
          <div className="flex gap-2">
             <div className="flex items-center gap-1.5">
               <div className="w-2 h-2 rounded-full bg-[#006591]" />
               <span className="text-[10px] font-bold text-slate-500 uppercase">Beras</span>
             </div>
             <div className="flex items-center gap-1.5">
               <div className="w-2 h-2 rounded-full bg-[#f59e0b]" />
               <span className="text-[10px] font-bold text-slate-500 uppercase">Minyak</span>
             </div>
          </div>
        </div>
        
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 10, fill: '#94a3b8'}} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 10, fill: '#94a3b8'}}
                tickFormatter={(value) => `Rp ${value/1000}k`}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Line 
                type="monotone" 
                dataKey="beras" 
                stroke="#006591" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#006591', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="minyak" 
                stroke="#f59e0b" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Insight Section */}
      <section className="bg-[#004532] text-white p-8 rounded-3xl flex flex-col md:flex-row items-center gap-8">
        <div className="bg-white/10 p-6 rounded-2xl">
          <Activity size={48} className="text-emerald-300" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Proyeksi Pasar</h3>
          <p className="mt-2 text-emerald-100/80 leading-relaxed text-sm">
            Berdasarkan tren kenaikan harga pupuk dan curah hujan rendah, komoditas Hortikultura diprediksi akan mengalami kenaikan 5-8% dalam dua pekan ke depan. Disarankan untuk memantau stok di Pasar Gadang untuk harga terbaik.
          </p>
        </div>
      </section>
    </motion.div>
  );
}

function AdminView({ stats, prices, fetchData, onLogout, userLocation }: { 
  stats: AppStats | null, 
  prices: PriceItem[],
  fetchData: (region?: string) => void,
  userLocation: string,
  onLogout: () => void 
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-6 pb-12"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Developer Panel</h2>
          <p className="text-slate-500 text-sm">System Monitoring & Backend Controls</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchData}
            className="bg-[#004532] text-white flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold shadow-sm active:rotate-180 transition-all duration-500"
          >
            <RefreshCw size={18} />
            Manual Refresh
          </button>
          <button 
            onClick={onLogout}
            className="bg-red-50 text-red-500 border border-red-100 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold shadow-sm active:scale-95 transition-all"
          >
            <LogOut size={18} />
            Exit Admin
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ... existing stats cards ... */}
        {/* Status Card */}
        <div className="bg-white border border-[#e2e8f0] p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Status</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Active
            </div>
          </div>
          <div className="space-y-3">
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center gap-4">
              <Terminal size={18} className="text-[#004532]" />
              <div>
                <p className="text-[10px] font-bold text-slate-400">Scraper Engine</p>
                <p className="text-xs font-bold text-[#004532]">Running</p>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center gap-4">
              <Database size={18} className="text-[#006591]" />
              <div>
                <p className="text-[10px] font-bold text-slate-400">Database Engine</p>
                <p className="text-xs font-bold text-[#006591]">Connected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Stats Card */}
        <div className="bg-white border border-[#e2e8f0] p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ingested Today</span>
            <div className="mt-2 flex items-baseline gap-2">
              <h3 className="text-4xl font-bold text-slate-900">{stats?.ingestedToday.toLocaleString()}</h3>
            </div>
            <div className="mt-1 flex items-center gap-1 text-emerald-500 text-xs font-bold">
              <TrendingUp size={14} />
              +{stats?.changeFromYesterday}% from yesterday
            </div>
          </div>
          <div className="mt-6">
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#004532] h-full transition-all duration-1000" style={{ width: `${(stats?.quotaUsed || 0) / (stats?.quotaMax || 1) * 100}%` }} />
            </div>
            <p className="text-[10px] font-bold text-slate-400 mt-2 text-right">Quota: {stats?.quotaUsed} / {stats?.quotaMax}</p>
          </div>
        </div>

        {/* Lead Profile */}
        <div className="bg-[#004532] text-white p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest">Lead Developer</span>
            <div className="flex items-center gap-4 mt-6">
              <div className="w-16 h-16 rounded-full border-2 border-emerald-300 bg-white flex items-center justify-center p-1">
                 <div className="w-full h-full bg-emerald-100 rounded-full flex items-center justify-center text-[#004532]">
                   <Activity size={32} />
                 </div>
              </div>
              <div>
                <h3 className="text-lg font-bold">M Nasri AW</h3>
                <p className="text-xs text-emerald-100/70">Fullstack Engineer</p>
              </div>
            </div>
          </div>
          <div className="mt-8 flex gap-2 relative z-10">
            {['Python', 'Node.js', 'React'].map(tag => (
              <span key={tag} className="text-[10px] font-bold px-3 py-1 bg-white/10 rounded-lg">{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Scraped Prices Table */}
      <section className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Database size={18} className="text-[#006591]" />
            Live Scraped Data
          </h3>
          <span className="text-[10px] font-bold text-slate-400">Total: {prices.length} items</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Commodity</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Price</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Change</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update Time</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Market</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {prices.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-slate-800">{item.name}</td>
                  <td className="px-6 py-4 text-sm font-bold text-[#006591]">Rp {item.price.toLocaleString('id-ID')}</td>
                  <td className={`px-6 py-4 text-xs font-bold ${item.change >= 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {item.change >= 0 ? `+${item.change.toLocaleString()}` : item.change.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold bg-[#eff4ff] text-[#006591] px-2 py-1 rounded-lg">
                      {item.lastUpdate}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[10px] font-bold text-slate-400">{item.market}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 bg-slate-900 rounded-2xl overflow-hidden flex flex-col h-full min-h-[300px]">
          <div className="bg-white border-b border-slate-100 p-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <History size={20} className="text-slate-400" />
              <h3 className="font-bold text-slate-800">Scraper Log</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400">Status: Running</span>
          </div>
          <div className="p-6 space-y-4 font-mono text-xs text-slate-400 overflow-y-auto">
            {/* Logs simulation */}
            <div className="flex gap-4 border-l-2 border-[#004532] pl-4">
              <span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span>
              <span className="text-emerald-400 font-bold">SCRAPE:</span>
              <span>Success parsing {prices.length} items from {userLocation} nodes.</span>
            </div>
            {prices.map((p, i) => (
              i < 5 && (
                <div key={p.id} className="flex gap-4 border-l-2 border-slate-700 pl-4 opacity-70">
                  <span className="text-slate-600">[{p.lastUpdate}]</span>
                  <span className="text-slate-500 font-bold">INFO:</span>
                  <span>{p.name} updated to Rp {p.price}</span>
                </div>
              )
            ))}
          </div>
        </div>

        <div className="md:col-span-4 flex flex-col gap-6">
          <div className="bg-white border border-[#e2e8f0] p-6 rounded-2xl h-full">
            <h4 className="font-bold text-slate-800 mb-6">Health Monitor</h4>
            <div className="space-y-6">
              <HealthBar label="CPU" value={stats?.serverHealth.cpu || 0} color="bg-[#006591]" />
              <HealthBar label="RAM" value={50} color="bg-[#006591]" secondaryLabel="512MB" />
              <HealthBar label="Ping" value={15} color="bg-[#004532]" secondaryLabel="45ms" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function HealthBar({ label, value, color, secondaryLabel }: { label: string, value: number, color: string, secondaryLabel?: string }) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
        <span className="text-[10px] font-bold text-slate-800">{secondaryLabel || `${value}%`}</span>
      </div>
      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
        <div className={`${color} h-full transition-all duration-1000`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ActionButton({ icon, label, color }: { icon: React.ReactNode, label: string, color: string }) {
  return (
    <button className="bg-white border border-[#e2e8f0] p-4 rounded-xl flex flex-col items-center gap-2 hover:bg-slate-50 transition-colors">
      <div className={color}>{icon}</div>
      <span className="text-[10px] font-bold text-slate-400 uppercase">{label}</span>
    </button>
  );
}

function TasksView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      setTasks(data.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTaskTitle, priority: newTaskPriority })
      });
      const data = await res.json();
      setTasks([...tasks, data.data]);
      setNewTaskTitle('');
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const toggleTask = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentStatus })
      });
      setTasks(tasks.map(t => t.id === id ? { ...t, completed: !currentStatus } : t));
    } catch (error) {
      console.error("Error toggling task:", error);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      setTasks(tasks.filter(t => t.id !== id));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <section className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#004532]">Monitoring Tasks</h2>
          <p className="text-slate-500 text-sm mt-1">Kelola tugas operasional pasar harian.</p>
        </div>
        <div className="bg-[#a6f2d1] p-3 rounded-2xl text-[#004532]">
          <CheckSquare size={24} />
        </div>
      </section>

      {/* Add Task Form */}
      <section className="bg-white border border-[#e2e8f0] p-6 rounded-2xl shadow-sm">
        <form onSubmit={addTask} className="space-y-4">
          <div className="flex gap-4">
            <input 
              type="text" 
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Apa yang perlu dilakukan?" 
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#004532] transition-colors"
            />
            <select 
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#004532] transition-colors"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <button 
              type="submit"
              className="bg-[#004532] text-white p-3 rounded-xl hover:opacity-90 transition-opacity active:scale-95"
            >
              <Plus size={20} />
            </button>
          </div>
        </form>
      </section>

      {/* Task List */}
      <section className="space-y-3">
        {loading ? (
           Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white border border-[#e2e8f0] p-5 rounded-2xl h-20 animate-pulse" />
          ))
        ) : (
          tasks.map(task => (
            <motion.div 
              layout
              key={task.id} 
              className={`bg-white border border-[#e2e8f0] p-5 rounded-2xl flex items-center justify-between group transition-all ${
                task.completed ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => toggleTask(task.id, task.completed)}
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                    task.completed 
                      ? 'bg-[#004532] border-[#004532] text-white' 
                      : 'border-slate-200 hover:border-[#004532]'
                  }`}
                >
                  {task.completed && <CheckSquare size={14} />}
                </button>
                <div>
                  <h4 className={`font-bold text-slate-800 ${task.completed ? 'line-through' : ''}`}>
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                      task.priority === 'High' ? 'bg-red-50 text-red-500' :
                      task.priority === 'Medium' ? 'bg-amber-50 text-amber-500' :
                      'bg-emerald-50 text-emerald-500'
                    }`}>
                      {task.priority} Priority
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => deleteTask(task.id)}
                className="text-slate-300 hover:text-red-500 transition-colors p-2"
              >
                <Trash2 size={18} />
              </button>
            </motion.div>
          ))
        )}
        {!loading && tasks.length === 0 && (
          <div className="text-center py-12">
            <PlusCircle size={48} className="mx-auto text-slate-200 mb-3" />
            <p className="text-slate-400 text-sm font-medium">Belum ada tugas operasional.</p>
          </div>
        )}
      </section>
    </motion.div>
  );
}
