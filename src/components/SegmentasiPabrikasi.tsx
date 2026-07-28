import React, { useState } from 'react';
import { ThawingItem, FabricationSegment } from '../types';
import { Play, Plus, Trash2, CheckCircle2, Info, AlertTriangle, Scale } from 'lucide-react';

interface SegmentasiPabrikasiProps {
  items: ThawingItem[];
  existingSegments: FabricationSegment[];
  onSaveSegments: (itemId: string, segments: { segmentName: string; targetWeight: number; actualWeight: number }[]) => void;
  safeFabricationLossPercent: number;
}

interface TempSegment {
  segmentName: string;
  targetWeight: string;
  actualWeight: string;
}

export default function SegmentasiPabrikasi({
  items,
  existingSegments,
  onSaveSegments,
  safeFabricationLossPercent,
}: SegmentasiPabrikasiProps) {
  const readyItems = items.filter((i) => i.status === 'pabrikasi_ready');
  const finishedItems = items.filter((i) => i.status === 'pabrikasi_done');

  // State for item currently being fabricated
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [tempSegments, setTempSegments] = useState<TempSegment[]>([
    { segmentName: 'Prime Cut (Utama)', targetWeight: '', actualWeight: '' },
    { segmentName: 'Fat & Trim (Lemak/Tetelan)', targetWeight: '', actualWeight: '' },
  ]);
  const [errorMsg, setErrorMsg] = useState('');

  const activeItem = items.find((i) => i.id === activeItemId);

  // Open fabrication screen for an item
  const handleStartFabrication = (item: ThawingItem) => {
    setActiveItemId(item.id);
    setErrorMsg('');
    
    // Set smart defaults based on plans
    const isSteak = item.plannedFabrication.toLowerCase().includes('steak');
    if (isSteak) {
      setTempSegments([
        { segmentName: 'Steak Portion (Prime)', targetWeight: (item.weightAfterThawing! * 0.8).toFixed(1), actualWeight: '' },
        { segmentName: 'Trim / Fat Scrap', targetWeight: (item.weightAfterThawing! * 0.15).toFixed(1), actualWeight: '' },
      ]);
    } else {
      setTempSegments([
        { segmentName: 'Hasil Utama (Prime)', targetWeight: (item.weightAfterThawing! * 0.85).toFixed(1), actualWeight: '' },
        { segmentName: 'Tetelan / Sisa Potong', targetWeight: (item.weightAfterThawing! * 0.1).toFixed(1), actualWeight: '' },
      ]);
    }
  };

  // Add a new segment row manually
  const handleAddSegmentRow = () => {
    setTempSegments([
      ...tempSegments,
      { segmentName: `Segmen Manual ${tempSegments.length + 1}`, targetWeight: '', actualWeight: '' },
    ]);
  };

  // Remove a segment row
  const handleRemoveSegmentRow = (idx: number) => {
    if (tempSegments.length <= 1) {
      setErrorMsg('Minimal harus ada 1 segmen potongan!');
      return;
    }
    const updated = [...tempSegments];
    updated.splice(idx, 1);
    setTempSegments(updated);
  };

  // Handle value changes in the temporary segments
  const handleSegmentChange = (idx: number, field: keyof TempSegment, value: string) => {
    const updated = [...tempSegments];
    updated[idx][field] = value;
    setTempSegments(updated);
  };

  // Submit and save the segment division
  const handleSaveFabrication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItemId || !activeItem) return;

    // Validate
    let totalActualWeight = 0;
    const cleanSegments: { segmentName: string; targetWeight: number; actualWeight: number }[] = [];

    for (let i = 0; i < tempSegments.length; i++) {
      const seg = tempSegments[i];
      if (!seg.segmentName.trim()) {
        setErrorMsg(`Nama segmen ke-${i + 1} tidak boleh kosong!`);
        return;
      }
      const target = parseFloat(seg.targetWeight);
      const actual = parseFloat(seg.actualWeight);

      if (isNaN(target) || target < 0 || isNaN(actual) || actual < 0) {
        setErrorMsg(`Target & realisasi berat segmen "${seg.segmentName}" harus angka positif!`);
        return;
      }

      totalActualWeight += actual;
      cleanSegments.push({
        segmentName: seg.segmentName,
        targetWeight: target,
        actualWeight: actual,
      });
    }

    const weightAfterThawing = activeItem.weightAfterThawing || 0;
    if (totalActualWeight > weightAfterThawing) {
      setErrorMsg(
        `Total berat hasil segmentasi (${totalActualWeight.toFixed(2)} Kg) melebihi berat bahan baku (${weightAfterThawing.toFixed(2)} Kg)! Periksa kembali timbangan.`
      );
      return;
    }

    // Call save callback
    onSaveSegments(activeItemId, cleanSegments);
    setActiveItemId(null);
  };

  // Calculate live preview metrics for the active item
  const calculateLiveMetrics = () => {
    if (!activeItem) return { totalActual: 0, loss: 0, lossPercent: 0, lossPerSegment: 0 };
    const weightAfterThawing = activeItem.weightAfterThawing || 0;
    
    const totalActual = tempSegments.reduce((sum, s) => {
      const val = parseFloat(s.actualWeight);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

    const loss = Math.max(0, weightAfterThawing - totalActual);
    const lossPercent = weightAfterThawing > 0 ? (loss / weightAfterThawing) * 100 : 0;
    const numSegments = tempSegments.length;
    const lossPerSegment = numSegments > 0 ? loss / numSegments : 0;

    return { totalActual, loss, lossPercent, lossPerSegment };
  };

  const live = calculateLiveMetrics();

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          🔪 Segmentasi & Pemotongan Daging
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Bagi daging utuh (prime subprimal) menjadi bagian-bagian porsi retail (Steak, Slice, Fat Trim).
        </p>
      </div>

      {activeItemId && activeItem ? (
        /* --- ACTIVE FABRICATION INTERACTIVE SCREEN --- */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-250">
          <div className="bg-slate-900 text-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs bg-emerald-500 text-slate-950 font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
                Tahap 3: Pemotongan (Segmentasi)
              </span>
              <h2 className="text-xl font-bold">{activeItem.name}</h2>
              <p className="text-slate-300 text-sm mt-1">
                Berat Bahan Baku untuk Dipotong: <strong className="text-white text-base">{activeItem.weightAfterThawing?.toFixed(2)} Kg</strong>
              </p>
            </div>
            
            {/* Display plan to butcher */}
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 max-w-md">
              <span className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                📋 Rencana Pabrikasi Terhubung:
              </span>
              <p className="text-slate-200 text-sm font-semibold">{activeItem.plannedFabrication}</p>
            </div>
          </div>

          <form onSubmit={handleSaveFabrication} className="p-6 space-y-6">
            {errorMsg && (
              <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-start gap-2 text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-slate-700">Daftar Segmen Hasil Potongan</span>
                <button
                  type="button"
                  onClick={handleAddSegmentRow}
                  className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer border border-emerald-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Segmen Potongan Manual
                </button>
              </div>

              {/* Segment rows */}
              <div className="space-y-3">
                {tempSegments.map((seg, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-3 items-center"
                  >
                    <span className="flex-none flex items-center justify-center w-8 h-8 bg-slate-200 text-slate-700 font-bold rounded-full text-sm">
                      {idx + 1}
                    </span>

                    {/* Segment Name */}
                    <div className="flex-1 w-full">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Nama Hasil Potongan</label>
                      <input
                        type="text"
                        placeholder="Contoh: Portion Ribeye Steak 200g"
                        value={seg.segmentName}
                        onChange={(e) => handleSegmentChange(idx, 'segmentName', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 font-medium"
                      />
                    </div>

                    {/* Target Weight */}
                    <div className="w-full md:w-32">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Target Berat (Kg)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.0"
                        value={seg.targetWeight}
                        onChange={(e) => handleSegmentChange(idx, 'targetWeight', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700"
                      />
                    </div>

                    {/* Actual weight */}
                    <div className="w-full md:w-36">
                      <label className="block text-[10px] font-semibold text-amber-700 uppercase mb-1">Berat Real Timbangan (Kg)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Masukkan berat"
                        value={seg.actualWeight}
                        onChange={(e) => handleSegmentChange(idx, 'actualWeight', e.target.value)}
                        className="w-full px-3 py-2 bg-amber-50 border-2 border-amber-300 focus:border-amber-500 rounded-lg text-sm font-bold text-slate-900"
                      />
                    </div>

                    {/* Trash */}
                    <button
                      type="button"
                      onClick={() => handleRemoveSegmentRow(idx)}
                      className="p-2 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg self-end md:self-center transition-all cursor-pointer"
                      title="Hapus Segmen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* LIVE PREVIEW SHRINAKGE CALCULATOR */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-900 text-white rounded-xl">
              <div>
                <span className="text-slate-400 text-xs">Total Berat Tercatat:</span>
                <p className="text-xl font-bold">{live.totalActual.toFixed(2)} / {activeItem.weightAfterThawing?.toFixed(2)} Kg</p>
              </div>
              <div>
                <span className="text-slate-400 text-xs">Total Susut Pemotongan:</span>
                <p className={`text-xl font-bold ${live.lossPercent <= safeFabricationLossPercent ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {live.loss.toFixed(2)} Kg ({live.lossPercent.toFixed(1)}%)
                </p>
              </div>
              <div className="border-l border-slate-800 pl-4">
                <span className="text-amber-400 text-xs flex items-center gap-1 font-semibold">
                  <Info className="w-3.5 h-3.5" /> Susut Rata-Rata per Segmen:
                </span>
                <p className="text-xl font-bold text-amber-300">{live.lossPerSegment.toFixed(3)} Kg / Segmen</p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 justify-end">
              <button
                type="button"
                onClick={() => setActiveItemId(null)}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all cursor-pointer"
              >
                Batal & Kembali
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center gap-1 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Simpan & Selesaikan Pabrikasi
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* --- MAIN LIST VIEW OF READY ITEMS --- */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* List of pending fabrications (Col-8) */}
          <div className="lg:col-span-8 space-y-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Bahan Siap Potong ({readyItems.length})</h3>

            {readyItems.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-12 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <p className="text-slate-600 font-bold">Semua daging telah dipabrikasi!</p>
                <p className="text-slate-400 text-xs mt-1">Belum ada daging baru yang selesai dithawing dari antrian.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {readyItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-md border border-amber-200">
                          Siap Potong
                        </span>
                        <span className="text-xs text-slate-400">Thawing Selesai: {new Date(item.thawingEndTime || '').toLocaleTimeString()}</span>
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 mt-1.5">{item.name}</h4>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>Berat Bersih (Kering): <strong>{item.weightAfterThawing?.toFixed(2)} Kg</strong></span>
                        <span>•</span>
                        <span>Rencana: <strong>{item.plannedFabrication}</strong></span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartFabrication(item)}
                      className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer text-base shrink-0 self-end md:self-auto"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Gas Potong 🔪
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fabrication Shrinkage Stats Window (Col-4) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs">
              <h3 className="font-bold text-slate-900 text-base mb-3 flex items-center gap-1.5">
                <Scale className="text-amber-500 w-5 h-5" />
                Window Susut Pabrikasi
              </h3>
              <p className="text-slate-500 text-xs mb-4">
                Susut pabrikasi diakibatkan oleh serpihan potongan, lemak terbuang, atau serat daging kering. Batas maksimal toleransi adalah <strong>{safeFabricationLossPercent}%</strong>.
              </p>

              <div className="space-y-3">
                {finishedItems.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl">
                    Belum ada data pabrikasi yang diselesaikan hari ini.
                  </p>
                ) : (
                  finishedItems.map((item) => {
                    const segments = existingSegments.filter((s) => s.itemId === item.id);
                    const totalSegmentWeight = segments.reduce((sum, s) => sum + s.actualWeight, 0);
                    const weightAfterThawing = item.weightAfterThawing || 0;
                    
                    const loss = Math.max(0, weightAfterThawing - totalSegmentWeight);
                    const lossPercent = weightAfterThawing > 0 ? (loss / weightAfterThawing) * 100 : 0;
                    const numSegments = segments.length;
                    const lossPerSeg = numSegments > 0 ? loss / numSegments : 0;

                    const isSafe = lossPercent <= safeFabricationLossPercent;

                    return (
                      <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
                        <div className="flex justify-between font-bold text-slate-800">
                          <span className="truncate max-w-[150px]">{item.name}</span>
                          <span className={isSafe ? 'text-emerald-600' : 'text-red-600'}>
                            -{loss.toFixed(2)} Kg ({lossPercent.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-500 text-[10px]">
                          <span>Bahan: {weightAfterThawing.toFixed(1)} Kg</span>
                          <span>Hasil Segmen: {totalSegmentWeight.toFixed(1)} Kg</span>
                        </div>
                        
                        {/* Display custom division from user's formula */}
                        <div className="bg-slate-100 p-1.5 rounded-md text-[10px] text-slate-600 flex justify-between">
                          <span>Jumlah Segmen: <strong>{numSegments} Bagian</strong></span>
                          <span>Beban Susut/Segmen: <strong className="text-amber-700">{lossPerSeg.toFixed(3)} Kg</strong></span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
