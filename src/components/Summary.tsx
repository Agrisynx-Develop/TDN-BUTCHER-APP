import React from 'react';
import { ThawingItem, FabricationSegment, DailyClosingReport } from '../types';
import { Scale, AlertTriangle, ShieldCheck, PieChart, Layers, Tag } from 'lucide-react';

interface SummaryProps {
  items: ThawingItem[];
  segments: FabricationSegment[];
  pastReports: DailyClosingReport[];
  safeThawingLossPercent: number;
  safeFabricationLossPercent: number;
}

export default function Summary({
  items,
  segments,
  safeThawingLossPercent,
  safeFabricationLossPercent,
}: SummaryProps) {
  // Computed statistics on active items & segments
  const totalWeightBefore = items.reduce((sum, i) => sum + i.weightBeforeThawing, 0);
  const totalWeightAfterThaw = items.reduce((sum, i) => sum + (i.weightAfterThawing || i.weightBeforeThawing), 0);
  const totalWeightAfterSegments = segments.reduce((sum, s) => sum + s.actualWeight, 0);

  // Today's losses
  const todayThawingLossKg = Math.max(0, totalWeightBefore - totalWeightAfterThaw);
  const todayThawingLossPercent = totalWeightBefore > 0 ? (todayThawingLossKg / totalWeightBefore) * 100 : 0;

  const todayFabricationLossKg = Math.max(0, totalWeightAfterThaw - totalWeightAfterSegments);
  const todayFabricationLossPercent = totalWeightAfterThaw > 0 ? (todayFabricationLossKg / totalWeightAfterThaw) * 100 : 0;

  // Status indicators
  const isThawingCritical = todayThawingLossPercent > safeThawingLossPercent;
  const isFabricationCritical = todayFabricationLossPercent > safeFabricationLossPercent;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          📊 Summary & Analisis Pabrikasi
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Ringkasan berat, persentase susut thawing & pabrikasi, serta rincian harga per kg tiap bahan baku.
        </p>
      </div>

      {/* --- OVERVIEW METRICS BENTO GRID --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Berat Awal</span>
          <h3 className="text-2xl font-black text-slate-900 mt-2">{totalWeightBefore.toFixed(2)} <span className="text-sm font-normal text-slate-500">Kg</span></h3>
          <p className="text-xs text-slate-500 mt-1">{items.length} Bahan baku tercatat</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Hasil Thawing</span>
          <h3 className="text-2xl font-black text-slate-900 mt-2">{totalWeightAfterThaw.toFixed(2)} <span className="text-sm font-normal text-slate-500">Kg</span></h3>
          <p className="text-xs text-slate-500 mt-1">
            Susut Thawing: <strong className={isThawingCritical ? 'text-rose-600' : 'text-emerald-600'}>{todayThawingLossPercent.toFixed(1)}%</strong>
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Hasil Potong Segmen</span>
          <h3 className="text-2xl font-black text-slate-900 mt-2">{totalWeightAfterSegments.toFixed(2)} <span className="text-sm font-normal text-slate-500">Kg</span></h3>
          <p className="text-xs text-slate-500 mt-1">
            Susut Fab: <strong className={isFabricationCritical ? 'text-rose-600' : 'text-emerald-600'}>{todayFabricationLossPercent.toFixed(1)}%</strong>
          </p>
        </div>

        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Efisiensi Hasil Daging</span>
          <h3 className="text-2xl font-black text-emerald-400 mt-2">
            {totalWeightBefore > 0 ? ((totalWeightAfterSegments / totalWeightBefore) * 100).toFixed(1) : '100.0'}%
          </h3>
          <p className="text-xs text-slate-400 mt-1">Rasio berat akhir vs awal</p>
        </div>
      </div>

      {/* --- LIVE ALERTS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Thawing Alarm Card */}
        <div className={`p-5 rounded-2xl border flex items-start gap-4 transition-all ${
          isThawingCritical
            ? 'bg-rose-50 border-rose-200 text-rose-950 shadow-xs'
            : 'bg-emerald-50 border-emerald-100 text-emerald-950'
        }`}>
          <div className={`p-3 rounded-xl shrink-0 ${isThawingCritical ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
            {isThawingCritical ? <AlertTriangle className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="font-bold text-base">Alarm Susut Thawing</h3>
            <p className="text-xs text-slate-500 mt-0.5">Batas aman target: {safeThawingLossPercent.toFixed(1)}%</p>
            <p className="text-sm font-semibold mt-2">
              Tingkat susut thawing: <span className={isThawingCritical ? 'text-rose-600 font-extrabold' : 'text-emerald-600'}>{todayThawingLossPercent.toFixed(1)}%</span>
            </p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {isThawingCritical
                ? '⚠️ PERINGATAN: Daging terlalu lama direndam air es atau suhu thawing terlalu hangat!'
                : '✅ Bagus! Proses pelarutan air es berjalan dengan kelembaban optimal.'}
            </p>
          </div>
        </div>

        {/* Fabrication Alarm Card */}
        <div className={`p-5 rounded-2xl border flex items-start gap-4 transition-all ${
          isFabricationCritical
            ? 'bg-rose-50 border-rose-200 text-rose-950 shadow-xs'
            : 'bg-emerald-50 border-emerald-100 text-emerald-950'
        }`}>
          <div className={`p-3 rounded-xl shrink-0 ${isFabricationCritical ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
            {isFabricationCritical ? <AlertTriangle className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="font-bold text-base">Alarm Susut Pemotongan (Fab)</h3>
            <p className="text-xs text-slate-500 mt-0.5">Batas toleransi maksimal: {safeFabricationLossPercent.toFixed(1)}%</p>
            <p className="text-sm font-semibold mt-2">
              Tingkat susut potong: <span className={isFabricationCritical ? 'text-rose-600 font-extrabold' : 'text-emerald-600'}>{todayFabricationLossPercent.toFixed(1)}%</span>
            </p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {isFabricationCritical
                ? '⚠️ PERINGATAN: Terlalu banyak serpihan atau pemotongan fat trim berlebihan.'
                : '✅ Sempurna! Teknik pemotongan butcher presisi dan rapi.'}
            </p>
          </div>
        </div>
      </div>

      {/* --- DETAILED SUMMARY TABLE --- */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChart className="text-emerald-600 w-5 h-5" />
            <h3 className="font-bold text-slate-900 text-base">Rincian Per Bahan Baku & Harga Masing-Masing</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">{items.length} item aktif</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-4">Bahan Baku Daging</th>
                <th className="p-4">Harga / Kg (Rp)</th>
                <th className="p-4">Berat Awal</th>
                <th className="p-4">Berat Thawing</th>
                <th className="p-4">Susut Thawing</th>
                <th className="p-4">Hasil Segmen</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {items.map((item) => {
                const itemSegments = segments.filter((s) => s.itemId === item.id);
                const segWeight = itemSegments.reduce((sum, s) => sum + s.actualWeight, 0);
                const price = item.pricePerKg ? `Rp ${item.pricePerKg.toLocaleString('id-ID')}` : 'Belum diatur';

                const thawLossKg = item.weightAfterThawing !== undefined ? Math.max(0, item.weightBeforeThawing - item.weightAfterThawing) : 0;
                const thawLossPct = item.weightBeforeThawing > 0 ? (thawLossKg / item.weightBeforeThawing) * 100 : 0;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-slate-900">
                      <div>{item.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">Operator: {item.butcherName}</div>
                    </td>
                    <td className="p-4 font-semibold text-emerald-700 bg-emerald-50/50 rounded-lg">
                      <div className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-emerald-600" />
                        <span>{price}</span>
                      </div>
                    </td>
                    <td className="p-4 font-medium">{item.weightBeforeThawing.toFixed(2)} Kg</td>
                    <td className="p-4 font-medium">{item.weightAfterThawing ? `${item.weightAfterThawing.toFixed(2)} Kg` : '-'}</td>
                    <td className="p-4">
                      {item.weightAfterThawing !== undefined ? (
                        <span className={thawLossPct > safeThawingLossPercent ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                          {thawLossKg.toFixed(2)} Kg ({thawLossPct.toFixed(1)}%)
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-4 font-bold text-slate-900">
                      {segWeight > 0 ? `${segWeight.toFixed(2)} Kg` : '-'}
                      {itemSegments.length > 0 && (
                        <div className="text-[10px] text-slate-400 font-normal">
                          {itemSegments.length} segmen
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        item.status === 'thawing'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : item.status === 'pabrikasi_ready'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {item.status === 'thawing' ? 'Thawing' : item.status === 'pabrikasi_ready' ? 'Siap Potong' : 'Selesai'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
