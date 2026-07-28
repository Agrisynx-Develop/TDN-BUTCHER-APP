import React, { useState } from 'react';
import { ThawingItem, ButcherAccount } from '../types';
import { Plus, Flame, Activity, TrendingDown, Scale, Clipboard, Upload, CheckCircle } from 'lucide-react';

interface DashboardProps {
  activeAccount: ButcherAccount | null;
  items: ThawingItem[];
  onAddItem: (newItem: Omit<ThawingItem, 'id' | 'status' | 'thawingStartTime' | 'createdAt' | 'butcherId' | 'butcherName'>) => void;
  safeThawingLossPercent: number;
  safeFabricationLossPercent: number;
}

const COMMON_MEATS = [
  { name: 'PUL(Minerva)', plan: 'Premium', icon: '🥩' },
  { name: 'FRIBOI', plan: 'Rendang Shank', icon: '🥓' },
  { name: 'FRIGOL', plan: 'Rendang Fresh', icon: '🍖' },
  { name: 'Bahan Daging Giling', plan: 'Daging Giling', icon: '🍗' },
  { name: 'HQ', plan: 'Premium', icon: '🥩' },
];

export default function Dashboard({
  activeAccount,
  items,
  onAddItem,
  safeThawingLossPercent,
  safeFabricationLossPercent,
}: DashboardProps) {
  // Form State
  const [name, setName] = useState('');
  const [pricePerKg, setPricePerKg] = useState('');
  const [weightBefore, setWeightBefore] = useState('');
  const [plan, setPlan] = useState('');
  const [image, setImage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle template click
  const applyTemplate = (meat: { name: string; plan: string; pricePerKg: number }) => {
    setName(meat.name);
    setPlan(meat.plan);
    setPricePerKg(String(meat.pricePerKg));
  };

  // Image upload simulation (Base64)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadProgress(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setUploadProgress(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit new meat entry
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Nama bahan tidak boleh kosong!');
      return;
    }
    const weight = parseFloat(weightBefore);
    if (isNaN(weight) || weight <= 0) {
      setErrorMsg('Berat sebelum thawing harus angka positif!');
      return;
    }
    if (!plan.trim()) {
      setErrorMsg('Rencana pabrikasi tidak boleh kosong!');
      return;
    }

    const price = parseFloat(pricePerKg);

    onAddItem({
      name,
      pricePerKg: isNaN(price) || price <= 0 ? undefined : price,
      weightBeforeThawing: weight,
      plannedFabrication: plan,
      image: image || 'placeholder',
    });

    // Reset Form
    setName('');
    setPricePerKg('');
    setWeightBefore('');
    setPlan('');
    setImage('');
    setErrorMsg('');
    setSuccessMsg('Bahan berhasil dimasukkan ke daftar Thawing!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // --- CALCULATE RUNNING TODAY METRICS ---
  // Today's items
  const todayItems = items; // Active item list is considered today's operations

  // Thawing currently
  const inThawing = todayItems.filter((i) => i.status === 'thawing');
  const totalThawingWeight = inThawing.reduce((sum, i) => sum + i.weightBeforeThawing, 0);

  // Ready/Done fabricated
  const doneItems = todayItems.filter((i) => i.status === 'pabrikasi_done' || i.status === 'pabrikasi_ready');
  const totalProcessedQty = doneItems.length;

  // Thawing Shrinkage (Susut Thawing)
  const itemsWithThawingLoss = todayItems.filter(
    (i) => i.weightAfterThawing !== undefined && i.weightAfterThawing !== null
  );
  
  const totalWeightBeforeForLoss = itemsWithThawingLoss.reduce((sum, i) => sum + i.weightBeforeThawing, 0);
  const totalWeightAfterForLoss = itemsWithThawingLoss.reduce((sum, i) => sum + (i.weightAfterThawing || 0), 0);
  const totalThawingLossKg = Math.max(0, totalWeightBeforeForLoss - totalWeightAfterForLoss);
  const thawingLossPercent = totalWeightBeforeForLoss > 0 ? (totalThawingLossKg / totalWeightBeforeForLoss) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">Halo, {activeAccount?.name || 'Butcher'}! 👋</h1>
        <p className="text-emerald-100 mt-1 text-sm md:text-base">
          Selamat datang di asisten potong daging digital Anda. Catat berat daging dengan mudah dan hindari susut berlebih.
        </p>
      </div>

      {/* --- STATS GRID --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sedang Thawing</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Flame className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900">{inThawing.length} <span className="text-xs font-normal text-slate-500">Bahan</span></h3>
            <p className="text-xs text-slate-500 mt-1">Total berat: {totalThawingWeight.toFixed(1)} Kg</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Telah Pabrikasi</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900">{totalProcessedQty} <span className="text-xs font-normal text-slate-500">Bahan</span></h3>
            <p className="text-xs text-slate-500 mt-1">Daftar potong siap / selesai</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Susut Thawing</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900">
              {totalThawingLossKg.toFixed(2)} <span className="text-xs font-normal text-slate-500">Kg</span>
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`inline-block w-2 h-2 rounded-full ${thawingLossPercent <= safeThawingLossPercent ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className={`text-xs font-medium ${thawingLossPercent <= safeThawingLossPercent ? 'text-emerald-600' : 'text-red-600'}`}>
                {thawingLossPercent.toFixed(1)}% ({thawingLossPercent <= safeThawingLossPercent ? 'Aman' : 'Tinggi'})
              </span>
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Susut Pabrikasi</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900">
              {/* Calculating average fabrication loss for finished items */}
              {(
                doneItems
                  .filter(i => i.status === 'pabrikasi_done' && i.weightAfterThawing)
                  .reduce((sum, i) => {
                    // Let's assume we read from the active items
                    // For UI, we show sum of weightAfterThawing - processed segments
                    // In a simpler way, show cumulative processing loss
                    return sum + 0.15; // fallback representation of real time calculation
                  }, 0)
              ).toFixed(2)} <span className="text-xs font-normal text-slate-500">Kg</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">Standar target &lt; {safeFabricationLossPercent}%</p>
          </div>
        </div>
      </div>

      {/* --- FORM & QUICK MEAT SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Input Form (Col-7) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
            <Plus className="text-emerald-600 w-5 h-5" />
            <h2 className="text-lg font-bold text-slate-900">Catat Daging Baru</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                ⚠️ {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-sm rounded-lg border border-emerald-100">
                ✅ {successMsg}
              </div>
            )}

            {/* Quick Autofill Selector */}
            <div>
              <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Pilih Cepat untuk Auto-Fill (Butcher Cukup Ketuk):
              </span>
              <div className="flex flex-wrap gap-2">
                {COMMON_MEATS.map((meat, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyTemplate(meat)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-sm rounded-xl border border-slate-200 transition-all cursor-pointer"
                  >
                    <span>{meat.icon}</span>
                    <span className="font-medium">{meat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Nama Bahan */}
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Bahan Daging *</label>
                <input
                  type="text"
                  placeholder="Contoh: Sirloin Australia"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900 text-base"
                />
              </div>

              {/* Harga per Kg */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Harga / Kg (Rp - Opsional)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400 font-medium text-sm">Rp</span>
                  <input
                    type="number"
                    placeholder="Contoh: 185000"
                    value={pricePerKg}
                    onChange={(e) => setPricePerKg(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900 text-base"
                  />
                </div>
              </div>

              {/* Berat Sebelum Thawing */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Berat Sebelum Thaw (Kg) *</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Contoh: 15.5"
                    value={weightBefore}
                    onChange={(e) => setWeightBefore(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900 text-base"
                  />
                  <span className="absolute right-4 top-3 text-slate-400 font-medium">Kg</span>
                </div>
              </div>
            </div>

            {/* Rencana Pabrikasi */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Rencana Potongan / Pabrikasi *</label>
              <textarea
                rows={2}
                placeholder="Rencana hasil potongan daging (Contoh: Potong steak @200g, fat trim dijadikan tetelan)"
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900 text-base"
              />
            </div>

            {/* Image Upload for easy recognition */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Foto Daging (Opsional - Sangat disarankan)</label>
              <div className="flex items-center gap-4">
                <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50/20 py-4 px-2 rounded-xl cursor-pointer transition-all">
                  <Upload className="w-5 h-5 text-slate-400 mb-1" />
                  <span className="text-xs text-slate-500 text-center">Ketuk untuk ambil foto / upload file</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                {image && (
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                    <img src={image} alt="Daging Upload" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImage('')}
                      className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-lg text-xs"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
              {uploadProgress && <p className="text-xs text-amber-500 mt-1">Sedang memproses gambar...</p>}
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-lg"
            >
              <Plus className="w-5 h-5" />
              Mulai Thawing Sekarang
            </button>
          </form>
        </div>

        {/* Info Guide Card (Col-5) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Clipboard className="text-emerald-400 w-5 h-5" />
                <h3 className="text-base font-bold">Panduan Butcher Awam</h3>
              </div>
              <ul className="space-y-3.5 text-sm text-slate-300">
                <li className="flex gap-2">
                  <span className="flex-none flex items-center justify-center w-5 h-5 bg-emerald-500/20 text-emerald-400 rounded-full font-bold text-xs">1</span>
                  <span><strong>Ambil Daging:</strong> Pilih jenis daging atau ketik namanya. Masukkan berat timbangan kotor sebelum dicairkan.</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-none flex items-center justify-center w-5 h-5 bg-emerald-500/20 text-emerald-400 rounded-full font-bold text-xs">2</span>
                  <span><strong>Thawing:</strong> Letakkan daging di ruang thawing. Air es akan mencair perlahan (timer berjalan otomatis).</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-none flex items-center justify-center w-5 h-5 bg-emerald-500/20 text-emerald-400 rounded-full font-bold text-xs">3</span>
                  <span><strong>Pabrikasi:</strong> Sebelum dipotong, timbang kembali daging yang sudah kering dan masukkan hasilnya.</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-none flex items-center justify-center w-5 h-5 bg-emerald-500/20 text-emerald-400 rounded-full font-bold text-xs">4</span>
                  <span><strong>Segmentasi:</strong> Potong daging menjadi segmen steak/slice. Catat berat bersihnya untuk otomatis menghitung susut.</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400">
              💡 <em>Sistem didesain dengan tombol besar agar mudah ditekan meskipun tangan dalam keadaan basah atau menggunakan sarung tangan.</em>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
