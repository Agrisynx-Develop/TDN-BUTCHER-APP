import React, { useState, useEffect } from 'react';
import { ThawingItem, FabricationSegment, DailyClosingReport, ButcherAccount, LossAlertConfig } from './types';
import {
  getStoredAccounts,
  saveAccounts,
  getActiveAccount,
  setActiveAccount,
  getThawingItems,
  saveThawingItems,
  getFabricationSegments,
  saveFabricationSegments,
  getDailyReports,
  saveDailyReports,
  getLossConfig,
  saveLossConfig,
  resetDatabase,
  syncAllDataToCloud,
  loadAllDataFromCloud,
} from './utils/db';
import { supabase, isSupabaseConfigured } from './lib/supabase';

// Import Views
import Dashboard from './components/Dashboard';
import AntrianPabrikasi from './components/AntrianPabrikasi';
import SegmentasiPabrikasi from './components/SegmentasiPabrikasi';
import UpdateSusut from './components/UpdateSusut';
import RiwayatHarian from './components/RiwayatHarian';
import Summary from './components/Summary';
import AccountManager from './components/AccountManager';
import LoginScreen from './components/LoginScreen';

// Import Icons
import {
  LayoutDashboard,
  Timer,
  Scissors,
  TrendingDown,
  History,
  BarChart3,
  Users,
  Beef,
  Scale,
  Menu,
  X,
  RefreshCw,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

export default function App() {
  // Supabase Auth State
  const [currentUser, setCurrentUser] = useState<{ username: string; email?: string } | null>(() => {
    const saved = localStorage.getItem('supabase_logged_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'antrian' | 'segmentasi' | 'susut' | 'riwayat' | 'summary' | 'accounts'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core App Database State
  const [accounts, setAccounts] = useState<ButcherAccount[]>([]);
  const [activeAccount, setActiveAccountState] = useState<ButcherAccount | null>(null);
  const [items, setItems] = useState<ThawingItem[]>([]);
  const [segments, setSegments] = useState<FabricationSegment[]>([]);
  const [reports, setReports] = useState<DailyClosingReport[]>([]);
  const [lossConfig, setLossConfig] = useState<LossAlertConfig>({
    safeThawingLossPercent: 4.0,
    safeFabricationLossPercent: 6.0,
  });
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);

  // Load from local storage or cloud on startup
  useEffect(() => {
    let isMounted = true;

    async function initializeData() {
      if (currentUser?.username) {
        setIsLoadingCloud(true);
        const cloudData = await loadAllDataFromCloud(currentUser.username);
        if (cloudData && isMounted) {
          if (cloudData.accounts) setAccounts(cloudData.accounts);
          if (cloudData.items) setItems(cloudData.items);
          if (cloudData.segments) setSegments(cloudData.segments);
          if (cloudData.reports) setReports(cloudData.reports);
          if (cloudData.lossConfig) setLossConfig(cloudData.lossConfig);
          setIsLoadingCloud(false);
          return;
        }
      }

      // Fallback to local storage
      const storedAccs = getStoredAccounts();
      setAccounts(storedAccs);
      setItems(getThawingItems());
      setSegments(getFabricationSegments());
      setReports(getDailyReports());
      setLossConfig(getLossConfig());

      if (currentUser) {
        let currentAcc = storedAccs.find(
          (a) => a.name.toLowerCase() === currentUser.username.toLowerCase()
        );
        if (!currentAcc) {
          currentAcc = {
            id: `acc_${Date.now()}`,
            name: currentUser.username,
            role: 'Supervisor',
            createdAt: new Date().toISOString(),
          };
          const updated = [currentAcc, ...storedAccs];
          setAccounts(updated);
          saveAccounts(updated);
        }
        setActiveAccount(currentAcc.id);
        setActiveAccountState(currentAcc);
      } else {
        setActiveAccountState(getActiveAccount());
      }
      setIsLoadingCloud(false);
    }

    initializeData();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // Sync to Cloud whenever state changes
  useEffect(() => {
    if (currentUser?.username && !isLoadingCloud) {
      syncAllDataToCloud(currentUser.username, {
        accounts,
        items,
        segments,
        reports,
        lossConfig,
      });
    }
  }, [accounts, items, segments, reports, lossConfig, currentUser, isLoadingCloud]);

  // Auth Handlers
  const handleLoginSuccess = (username: string, email?: string) => {
    const userObj = { username, email };
    setCurrentUser(userObj);
    localStorage.setItem('supabase_logged_user', JSON.stringify(userObj));

    const storedAccs = getStoredAccounts();
    let found = storedAccs.find((a) => a.name.toLowerCase() === username.toLowerCase());
    if (!found) {
      found = {
        id: `acc_${Date.now()}`,
        name: username,
        role: 'Supervisor',
        createdAt: new Date().toISOString(),
      };
      const updated = [found, ...storedAccs];
      setAccounts(updated);
      saveAccounts(updated);
    }
    setActiveAccount(found.id);
    setActiveAccountState(found);
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('supabase_logged_user');
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }


  // --- ACTIONS & HANDLERS ---

  // Select account
  const handleSelectAccount = (id: string) => {
    setActiveAccount(id);
    const selected = accounts.find((a) => a.id === id) || null;
    setActiveAccountState(selected);
  };

  // Register new account
  const handleAddAccount = (name: string, role: ButcherAccount['role']) => {
    const newAcc: ButcherAccount = {
      id: `acc_${Date.now()}`,
      name,
      role,
      createdAt: new Date().toISOString(),
    };
    const updated = [...accounts, newAcc];
    setAccounts(updated);
    saveAccounts(updated);
    
    // Auto login new user
    handleSelectAccount(newAcc.id);
  };

  // Add new meat item for thawing (Step 1)
  const handleAddItemForThawing = (newItem: Omit<ThawingItem, 'id' | 'status' | 'thawingStartTime' | 'createdAt' | 'butcherId' | 'butcherName'>) => {
    const now = new Date();
    const item: ThawingItem = {
      ...newItem,
      id: `meat_${Date.now()}`,
      status: 'thawing',
      thawingStartTime: now.toISOString(),
      createdAt: now.toISOString(),
      butcherId: activeAccount?.id || 'acc_unknown',
      butcherName: activeAccount?.name || 'Butcher',
    };
    const updated = [item, ...items];
    setItems(updated);
    saveThawingItems(updated);
  };

  // Confirm weight after thawing (Step 2)
  const handleConfirmThawingWeight = (itemId: string, weightAfter: number) => {
    const updated = items.map((item) => {
      if (item.id === itemId) {
        const shrinkage = Math.max(0, item.weightBeforeThawing - weightAfter);
        const shrinkagePercent = (shrinkage / item.weightBeforeThawing) * 100;
        return {
          ...item,
          status: 'pabrikasi_ready' as const,
          weightAfterThawing: weightAfter,
          thawingEndTime: new Date().toISOString(),
          shrinkageThawing: shrinkage,
          shrinkageThawingPercent: shrinkagePercent,
        };
      }
      return item;
    });
    setItems(updated);
    saveThawingItems(updated);
    
    // Auto forward to Portions/Segmentation page
    setActiveTab('segmentasi');
  };

  // Save Fabrication Portioning (Step 3)
  const handleSaveFabricationSegments = (itemId: string, segmentList: { segmentName: string; targetWeight: number; actualWeight: number }[]) => {
    const newSegments: FabricationSegment[] = segmentList.map((seg, idx) => ({
      id: `seg_${Date.now()}_${idx}`,
      itemId,
      itemName: items.find((i) => i.id === itemId)?.name || 'Daging',
      segmentName: seg.segmentName,
      targetWeight: seg.targetWeight,
      actualWeight: seg.actualWeight,
      periodicShrinkage: 0,
      createdAt: new Date().toISOString(),
    }));

    // Update item status
    const updatedItems = items.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          status: 'pabrikasi_done' as const,
        };
      }
      return item;
    });

    const updatedSegments = [...segments, ...newSegments];
    setItems(updatedItems);
    setSegments(updatedSegments);
    saveThawingItems(updatedItems);
    saveFabricationSegments(updatedSegments);
  };

  // Update periodical shrinkage (Step 4)
  const handleUpdatePeriodicShrinkage = (segmentId: string, additionalShrinkage: number) => {
    const updatedSegments = segments.map((seg) => {
      if (seg.id === segmentId) {
        return {
          ...seg,
          actualWeight: Math.max(0, seg.actualWeight - additionalShrinkage),
          periodicShrinkage: seg.periodicShrinkage + additionalShrinkage,
        };
      }
      return seg;
    });
    setSegments(updatedSegments);
    saveFabricationSegments(updatedSegments);
  };

  // Perform Daily Close Out & Reset Dashboard
  const handleCloseDay = (closedReport: DailyClosingReport) => {
    const updatedReports = [closedReport, ...reports];
    setReports(updatedReports);
    saveDailyReports(updatedReports);

    // Wipe active list for next day
    setItems([]);
    setSegments([]);
    saveThawingItems([]);
    saveFabricationSegments([]);
    
    // Go to History tab
    setActiveTab('riwayat');
  };

  // Hard Reset Database (Developer/Supervisor use)
  const handleResetDb = () => {
    if (confirm('Apakah Anda yakin ingin menyetel ulang semua data kembali ke contoh awal? Semua catatan berjalan Anda hari ini akan terhapus.')) {
      resetDatabase();
      setAccounts(getStoredAccounts());
      setActiveAccountState(getActiveAccount());
      setItems(getThawingItems());
      setSegments(getFabricationSegments());
      setReports(getDailyReports());
      setLossConfig(getLossConfig());
      setActiveTab('dashboard');
    }
  };

  // Config parameters editing helper (Can be added in Summary screen if requested)
  const handleUpdatePrice = (newPrice: number) => {
    const updatedConfig = { ...lossConfig, meatPricePerKg: newPrice };
    setLossConfig(updatedConfig);
    saveLossConfig(updatedConfig);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800 antialiased selection:bg-emerald-500 selection:text-white">
      
      {/* --- SIDEBAR DESKTOP --- */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 shrink-0 border-r border-slate-800 z-10">
        {/* Brand logo */}
        <div className="p-5 flex items-center gap-2.5 border-b border-slate-800">
          <div className="p-1.5 bg-emerald-500 text-slate-950 rounded-lg">
            <Beef className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-white font-black tracking-tight leading-none text-base">Butcher Pro</h1>
            <span className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase">Meat Tracker v2</span>
          </div>
        </div>

        {/* User profile card widget */}
        <div className="p-4 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {activeAccount?.name.charAt(8) || 'B'}
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-white truncate leading-none">{activeAccount?.name || 'Butcher'}</span>
              <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">{activeAccount?.role || 'Staff'}</span>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('accounts')}
            className="text-[10px] bg-slate-700 hover:bg-slate-600 text-white font-bold px-2 py-1 rounded-md transition-all cursor-pointer shrink-0"
          >
            Ganti
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'dashboard' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-100'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab('antrian')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'antrian' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <Timer className="w-5 h-5" />
              <span>Antrian Thawing</span>
            </div>
            {items.filter((i) => i.status === 'thawing').length > 0 && (
              <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-1.5 py-0.5 rounded-full">
                {items.filter((i) => i.status === 'thawing').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('segmentasi')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'segmentasi' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <Scissors className="w-5 h-5" />
              <span>Segmentasi Potong</span>
            </div>
            {items.filter((i) => i.status === 'pabrikasi_ready').length > 0 && (
              <span className="bg-emerald-500 text-slate-950 font-black text-[10px] px-1.5 py-0.5 rounded-full">
                {items.filter((i) => i.status === 'pabrikasi_ready').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('susut')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'susut' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-100'
            }`}
          >
            <TrendingDown className="w-5 h-5" />
            Update Susut
          </button>

          <button
            onClick={() => setActiveTab('riwayat')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'riwayat' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-100'
            }`}
          >
            <History className="w-5 h-5" />
            Riwayat & Closing
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'summary' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-100'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Summary & Analisis
          </button>
        </nav>

        {/* Bottom utility */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          <button
            onClick={() => setActiveTab('accounts')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'accounts' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Users className="w-4 h-4" />
            Kelola Akun Butcher
          </button>
          
          <button
            onClick={handleResetDb}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-amber-400 hover:bg-amber-950/20 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Reset Data Contoh
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-950/40 transition-all cursor-pointer border border-rose-900/50 mt-1"
          >
            <LogOut className="w-4 h-4" />
            Keluar (Logout)
          </button>
        </div>
      </aside>

      {/* --- MOBILE NAVBAR/HEADER --- */}
      <header className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-2">
          <Beef className="w-6 h-6 text-emerald-500" />
          <span className="font-extrabold tracking-tight text-base">Butcher Pro</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 hover:bg-slate-800 rounded-lg transition-all"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* --- MOBILE DRAWER DROPDOWN --- */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bg-slate-950 text-slate-300 border-b border-slate-800 z-20 flex flex-col p-4 space-y-2 shadow-xl animate-in slide-in-from-top-4 duration-150">
          <button
            onClick={() => {
              setActiveTab('dashboard');
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-3 py-3 px-4 hover:bg-slate-900 rounded-xl"
          >
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </button>
          <button
            onClick={() => {
              setActiveTab('antrian');
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-3 py-3 px-4 hover:bg-slate-900 rounded-xl"
          >
            <Timer className="w-5 h-5" /> Antrian Thawing ({items.filter((i) => i.status === 'thawing').length})
          </button>
          <button
            onClick={() => {
              setActiveTab('segmentasi');
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-3 py-3 px-4 hover:bg-slate-900 rounded-xl"
          >
            <Scissors className="w-5 h-5" /> Segmentasi Potong ({items.filter((i) => i.status === 'pabrikasi_ready').length})
          </button>
          <button
            onClick={() => {
              setActiveTab('susut');
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-3 py-3 px-4 hover:bg-slate-900 rounded-xl"
          >
            <TrendingDown className="w-5 h-5" /> Update Susut
          </button>
          <button
            onClick={() => {
              setActiveTab('riwayat');
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-3 py-3 px-4 hover:bg-slate-900 rounded-xl"
          >
            <History className="w-5 h-5" /> Riwayat & Closing
          </button>
          <button
            onClick={() => {
              setActiveTab('summary');
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-3 py-3 px-4 hover:bg-slate-900 rounded-xl"
          >
            <BarChart3 className="w-5 h-5" /> Summary & Analisis
          </button>
          <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-xs px-4">
            <span>User: <strong>{currentUser?.username || activeAccount?.name || 'Butcher'}</strong></span>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="text-rose-400 font-bold flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar
            </button>
          </div>
        </div>
      )}

      {/* --- MAIN CONTENT STAGE AREA --- */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {activeTab === 'dashboard' && (
          <Dashboard
            activeAccount={activeAccount}
            items={items}
            onAddItem={handleAddItemForThawing}
            safeThawingLossPercent={lossConfig.safeThawingLossPercent}
            safeFabricationLossPercent={lossConfig.safeFabricationLossPercent}
          />
        )}

        {activeTab === 'antrian' && (
          <AntrianPabrikasi
            items={items}
            onStartFabrication={handleConfirmThawingWeight}
            safeThawingLossPercent={lossConfig.safeThawingLossPercent}
          />
        )}

        {activeTab === 'segmentasi' && (
          <SegmentasiPabrikasi
            items={items}
            existingSegments={segments}
            onSaveSegments={handleSaveFabricationSegments}
            safeFabricationLossPercent={lossConfig.safeFabricationLossPercent}
          />
        )}

        {activeTab === 'susut' && (
          <UpdateSusut
            segments={segments}
            onUpdateShrinkage={handleUpdatePeriodicShrinkage}
          />
        )}

        {activeTab === 'riwayat' && (
          <RiwayatHarian
            items={items}
            segments={segments}
            reports={reports}
            activeAccount={activeAccount}
            onCloseDay={handleCloseDay}
          />
        )}

        {activeTab === 'summary' && (
          <Summary
            items={items}
            segments={segments}
            pastReports={reports}
            safeThawingLossPercent={lossConfig.safeThawingLossPercent}
            safeFabricationLossPercent={lossConfig.safeFabricationLossPercent}
          />
        )}

        {activeTab === 'accounts' && (
          <AccountManager
            accounts={accounts}
            activeAccount={activeAccount}
            onSelectAccount={handleSelectAccount}
            onAddAccount={handleAddAccount}
          />
        )}
      </main>
    </div>
  );
}

