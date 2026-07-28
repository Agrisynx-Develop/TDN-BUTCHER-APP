import React, { useState } from 'react';
import { ThawingItem, FabricationSegment } from '../types';
import { RefreshCw, Scale, Save, AlertCircle, Sparkles, HelpCircle } from 'lucide-react';

interface UpdateSusutProps {
  segments: FabricationSegment[];
  onUpdateShrinkage: (segmentId: string, additionalShrinkage: number) => void;
}

export default function UpdateSusut({ segments, onUpdateShrinkage }: UpdateSusutProps) {
  const [selectedSegmentId, setSelectedSegmentId] = useState('');
  const [shrinkageInput, setShrinkageInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const selectedSegment = segments.find((s) => s.id === selectedSegmentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedSegmentId) {
      setErrorMsg('Harap pilih salah satu segmen potongan daging!');
      return;
    }

    const loss = parseFloat(shrinkageInput);
    if (isNaN(loss) || loss <= 0) {
      setErrorMsg('Harap masukkan nilai susut angka positif yang valid!');
      return;
    }

    if (selectedSegment && loss > selectedSegment.actualWeight) {
      setErrorMsg(`Nilai susut (${loss} Kg) melebihi berat riil segmen saat ini (${selectedSegment.actualWeight} Kg)!`);
      return;
    }

    // Trigger update callback
    onUpdateShrinkage(selectedSegmentId, loss);

    // Reset Form
    setShrinkageInput('');
    setSuccessMsg(`Berhasil menambahkan susut berkala sebesar ${loss} Kg pada "${selectedSegment?.segmentName}"!`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          📉 Update Susut Berkala
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Catat penyusutan berat daging selama penyimpanan di Chiller, Showcase, atau Freezer (susut penguapan).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input panel (Col-7) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
            <RefreshCw className="text-amber-500 w-5 h-5 animate-spin-slow" />
            <h2 className="text-lg font-bold text-slate-900">Input Susut Berkala</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-100 flex items-start gap-1.5">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Segment Selector */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Pilih Segmen Potongan Daging *
              </label>
              <select
                value={selectedSegmentId}
                onChange={(e) => setSelectedSegmentId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900 text-base"
              >
                <option value="">-- Ketuk Untuk Pilih Bagian Daging --</option>
                {segments.map((seg) => (
                  <option key={seg.id} value={seg.id}>
                    {seg.itemName} ➔ {seg.segmentName} (Berat: {seg.actualWeight.toFixed(2)} Kg)
                  </option>
                ))}
              </select>
            </div>

            {/* Current Segment Weight Display Card */}
            {selectedSegment && (
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Berat Awal Segmen:</span>
                  <span className="text-base font-bold text-slate-800">{selectedSegment.actualWeight.toFixed(2)} Kg</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Total Susut Berkala Tercatat:</span>
                  <span className="text-base font-bold text-amber-700">{selectedSegment.periodicShrinkage.toFixed(2)} Kg</span>
                </div>
              </div>
            )}

            {/* Weight Loss Input */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Jumlah Susut Tambahan (Kg) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.001"
                  placeholder="Contoh: 0.15 (berarti susut 150 gram)"
                  value={shrinkageInput}
                  onChange={(e) => setShrinkageInput(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900 text-lg font-bold"
                />
                <span className="absolute right-4 top-3 text-slate-400 font-bold">Kg</span>
              </div>
              <p className="text-slate-400 text-xs mt-1">
                Timbang sisa potongan dan hitung selisihnya, lalu masukkan di sini.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-base"
            >
              <Save className="w-5 h-5" />
              Simpan & Update Berat
            </button>
          </form>
        </div>

        {/* Informative ledger/explanation (Col-5) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle className="text-amber-400 w-5 h-5" />
                <h3 className="text-base font-bold">Mengapa Update Susut Penting?</h3>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed mb-4">
                Setelah daging dipotong-potong dan disimpan di chiller pajangan (showcase), kelembaban udara showcase yang kering akan menyerap cairan daging (moisture loss) sekitar <strong>0.5% - 1.5%</strong> per 24 jam.
              </p>
              
              <div className="border-t border-slate-800 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Efek Bagi Bisnis:</h4>
                <div className="flex gap-2 items-start text-xs text-slate-300">
                  <span className="text-red-400">✖</span>
                  <span>Jika berat susut berkala tidak dicatat, laporan stok kasir akan selisih dengan stok fisik.</span>
                </div>
                <div className="flex gap-2 items-start text-xs text-slate-300">
                  <span className="text-emerald-400">✔</span>
                  <span>Mencatat susut secara berkala membantu supervisor menyesuaikan harga jual agar margin keuntungan tidak hilang sia-sia.</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-emerald-500" />
              <span>Akurasi timbangan digital Anda harus dikalibrasi berkala.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

