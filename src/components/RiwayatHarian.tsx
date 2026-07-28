import React, { useState } from 'react';
import { ThawingItem, FabricationSegment, DailyClosingReport, ButcherAccount } from '../types';
import { FileText, Download, CheckSquare, Calendar, User, ArrowLeftRight, Coins, Printer, Sparkles, CheckCircle } from 'lucide-react';

interface RiwayatHarianProps {
  items: ThawingItem[];
  segments: FabricationSegment[];
  reports: DailyClosingReport[];
  activeAccount: ButcherAccount | null;
  onCloseDay: (closedReport: DailyClosingReport) => void;
}

export default function RiwayatHarian({
  items,
  segments,
  reports,
  activeAccount,
  onCloseDay,
}: RiwayatHarianProps) {
  const [selectedReport, setSelectedReport] = useState<DailyClosingReport | null>(null);
  const [viewingTodayDraft, setViewingTodayDraft] = useState(false);
  const [isClosingConfirm, setIsClosingConfirm] = useState(false);

  // --- COMPILE TODAY'S OPERATION DRAFT ---
  const compileTodayDraft = (): DailyClosingReport => {
    const now = new Date();
    
    const finishedItems = items.filter((i) => i.status === 'pabrikasi_done');
    const totalThawingQty = items.length;
    const totalProcessedQty = finishedItems.length;

    const totalWeightBeforeThawing = items.reduce((sum, i) => sum + i.weightBeforeThawing, 0);
    const totalWeightAfterThawing = items.reduce((sum, i) => sum + (i.weightAfterThawing || i.weightBeforeThawing), 0);
    
    // Sum of all segment weights for today
    const totalWeightAfterFabrication = segments.reduce((sum, s) => sum + s.actualWeight, 0);

    const totalThawingLoss = Math.max(0, totalWeightBeforeThawing - totalWeightAfterThawing);
    const totalFabricationLoss = Math.max(0, totalWeightAfterThawing - totalWeightAfterFabrication);

    // Collect itemized breakdown
    const itemsProcessedList = items.map((item) => {
      const itemSegments = segments.filter((s) => s.itemId === item.id);
      const finalWeight = itemSegments.reduce((sum, s) => sum + s.actualWeight, 0);
      const weightAfter = item.weightAfterThawing || item.weightBeforeThawing;

      const thawingLoss = Math.max(0, item.weightBeforeThawing - weightAfter);
      const thawingLossPercent = item.weightBeforeThawing > 0 ? (thawingLoss / item.weightBeforeThawing) * 100 : 0;

      const fabLoss = Math.max(0, weightAfter - finalWeight);
      const fabLossPercent = weightAfter > 0 ? (fabLoss / weightAfter) * 100 : 0;

      const fabricatedSegments = itemSegments.map((s) => ({
        segmentName: s.segmentName,
        actualWeight: s.actualWeight,
        targetWeight: s.targetWeight,
      }));

      return {
        id: item.id,
        name: item.name,
        pricePerKg: item.pricePerKg,
        weightBefore: item.weightBeforeThawing,
        weightAfter: weightAfter,
        finalWeight: finalWeight,
        thawingLossPercent,
        fabLossPercent,
        fabricatedSegments,
      };
    });

    // Unique operators
    const uniqueOperators = Array.from(new Set(items.map((i) => i.butcherName))).join(', ') || activeAccount?.name || 'Butcher';

    return {
      id: 'today_draft',
      date: now.toISOString().split('T')[0],
      totalThawingQty,
      totalProcessedQty,
      totalWeightBeforeThawing,
      totalWeightAfterThawing,
      totalWeightAfterFabrication,
      totalThawingLoss,
      totalFabricationLoss,
      butcherInCharge: uniqueOperators,
      itemsProcessed: itemsProcessedList,
      isClosed: false,
    };
  };

  const todayDraft = compileTodayDraft();

  // Trigger Daily Closing
  const handleConfirmClosing = () => {
    const finalReport: DailyClosingReport = {
      ...todayDraft,
      id: `rep_${Date.now()}`,
      isClosed: true,
      closedAt: new Date().toISOString(),
    };
    onCloseDay(finalReport);
    setIsClosingConfirm(false);
    setViewingTodayDraft(false);
  };

  // Open printer view for PDF
  const handlePrint = () => {
    window.print();
  };

  const activeReportView = selectedReport || (viewingTodayTodayReport() ? todayDraft : null);

  function viewingTodayTodayReport() {
    return viewingTodayDraft;
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          📋 Riwayat Laporan Harian
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Kelola laporan pertanggungjawaban pengerjaan daging harian, cetak PDF, dan lakukan closing toko.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Reports Directory & Actions (Col-5) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Today's Draft Actions Block */}
          <div className="bg-emerald-950 text-white rounded-2xl p-5 shadow-xs border border-emerald-800">
            <span className="text-xs bg-emerald-500 text-slate-950 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
              Hari Berjalan (Draft)
            </span>
            <h3 className="text-lg font-bold mt-2">Daftar Kerja Hari Ini</h3>
            <p className="text-emerald-100 text-xs mt-1">
              Ada <strong>{todayDraft.totalThawingQty} bahan</strong> dimasukkan, dan <strong>{todayDraft.totalProcessedQty} selesai</strong> dipabrikasi.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => {
                  setViewingTodayDraft(true);
                  setSelectedReport(null);
                }}
                className="py-2.5 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                View Laporan Hari Ini
              </button>

              <button
                onClick={() => setIsClosingConfirm(true)}
                disabled={todayDraft.totalThawingQty === 0}
                className={`py-2.5 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  todayDraft.totalThawingQty === 0
                    ? 'bg-emerald-900/50 text-emerald-300/50 cursor-not-allowed'
                    : 'bg-rose-600 hover:bg-rose-500 text-white'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                Closing Harian
              </button>
            </div>
          </div>

          {/* Historical List */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
              Arsip Laporan Sebelumnya ({reports.length})
            </h3>

            {reports.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Belum ada arsip laporan closing.</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {reports.map((rep) => (
                  <button
                    key={rep.id}
                    onClick={() => {
                      setSelectedReport(rep);
                      setViewingTodayDraft(false);
                    }}
                    className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      selectedReport?.id === rep.id
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <div>
                        <span className="text-sm font-bold block">
                          {new Date(rep.date).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="text-xs text-slate-500">Operator: {rep.butcherInCharge}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold bg-white px-2 py-0.5 rounded-md border text-slate-600 shadow-3xs">
                      {rep.totalThawingQty} Pcs
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* --- DYNAMIC PDF VIEW WINDOW (Col-7) --- */}
        <div className="lg:col-span-7">
          {activeReportView ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden flex flex-col">
              {/* PDF Viewer Header Toolbar */}
              <div className="bg-slate-100 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">
                  📄 PRABACA_DOKUMEN_PDF ({activeReportView.isClosed ? 'CLOSED' : 'DRAFT'})
                </span>
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg border border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak / Simpan PDF
                </button>
              </div>

              {/* Printable PDF Canvas Area */}
              <div id="pdf-report-canvas" className="p-8 bg-white text-slate-800 space-y-6 print:p-0">
                {/* Official Letterhead */}
                <div className="text-center space-y-1 pb-4 border-b-2 border-double border-slate-300">
                  <h2 className="text-xl font-black tracking-tight text-slate-900">
                    LAPORAN HARIAN FABRIKASI & SUSUT DAGING
                  </h2>
                  <p className="text-xs text-slate-500 tracking-widest uppercase">
                    DIVISI BUTCHER • INTEGRATED QUALITY ASSURANCE
                  </p>
                </div>

                {/* Report Metadata */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <p className="flex items-center gap-1.5 text-slate-600">
                      <Calendar className="w-3.5 h-3.5" /> Tanggal Operasi:
                    </p>
                    <p className="font-bold text-slate-800 text-sm">
                      {new Date(activeReportView.date).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="flex items-center gap-1.5 text-slate-600">
                      <User className="w-3.5 h-3.5" /> Penanggung Jawab Butcher:
                    </p>
                    <p className="font-bold text-slate-800 text-sm">{activeReportView.butcherInCharge}</p>
                  </div>
                </div>

                {/* Operational Summary KPI Grid inside PDF */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="text-center">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Susut Thawing</span>
                    <p className="text-lg font-black text-rose-600 mt-0.5">{activeReportView.totalThawingLoss.toFixed(2)} Kg</p>
                  </div>
                  <div className="text-center border-x border-slate-200">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Susut Pabrikasi</span>
                    <p className="text-lg font-black text-rose-600 mt-0.5">{activeReportView.totalFabricationLoss.toFixed(2)} Kg</p>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Rasio Hasil Daging</span>
                    <p className="text-lg font-black text-emerald-600 mt-0.5">
                      {activeReportView.totalWeightBeforeThawing > 0
                        ? ((activeReportView.totalWeightAfterFabrication / activeReportView.totalWeightBeforeThawing) * 100).toFixed(1)
                        : '100.0'}%
                    </p>
                  </div>
                </div>

                {/* Main Table Breakdown */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Detail Breakdown Item & Hasil Pabrikasi:</h4>
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                          <th className="p-2.5 font-bold min-w-[200px]">Nama Bahan Baku & Hasil Segmen</th>
                          <th className="p-2.5 font-bold text-right">Berat Awal (Kg)</th>
                          <th className="p-2.5 font-bold text-right">Pasca Thaw (Kg)</th>
                          <th className="p-2.5 font-bold text-right">Hasil Potong (Kg)</th>
                          <th className="p-2.5 font-bold text-right">Susut Thaw (%)</th>
                          <th className="p-2.5 font-bold text-right">Susut Fab (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeReportView.itemsProcessed.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-4 text-center text-slate-400">Belum ada item diproses hari ini.</td>
                          </tr>
                        ) : (
                          activeReportView.itemsProcessed.map((item, index) => (
                            <tr key={index} className="border-b border-slate-200 last:border-0 hover:bg-slate-50/50 align-top">
                              <td className="p-2.5">
                                <span className="font-bold text-slate-900 block">{item.name}</span>
                                {item.fabricatedSegments && item.fabricatedSegments.length > 0 ? (
                                  <div className="mt-1.5 space-y-1">
                                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                                      ✂️ Hasil Pabrikasi / Segmen:
                                    </span>
                                    <div className="flex flex-wrap gap-1">
                                      {item.fabricatedSegments.map((seg, sIdx) => (
                                        <span
                                          key={sIdx}
                                          className="inline-flex items-center gap-1 text-[10px] bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md"
                                        >
                                          <span className="font-medium text-slate-800">{seg.segmentName}:</span>
                                          <span className="font-mono font-bold text-emerald-700">{seg.actualWeight.toFixed(2)} Kg</span>
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-normal italic block mt-1">
                                    (Belum ada rincian segmen pabrikasi)
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 text-right font-mono">{item.weightBefore.toFixed(2)}</td>
                              <td className="p-2.5 text-right font-mono">{item.weightAfter.toFixed(2)}</td>
                              <td className="p-2.5 text-right font-mono font-bold text-slate-900">{item.finalWeight.toFixed(2)}</td>
                              <td className="p-2.5 text-right font-mono text-rose-600">{item.thawingLossPercent.toFixed(1)}%</td>
                              <td className="p-2.5 text-right font-mono text-rose-600">{item.fabLossPercent.toFixed(1)}%</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* PDF Footer Approvals block */}
                <div className="grid grid-cols-2 gap-8 pt-8 text-xs border-t border-slate-200 text-center text-slate-500">
                  <div className="space-y-12">
                    <p>Butcher Pelaksana,</p>
                    <div className="space-y-1">
                      <p className="font-bold text-slate-800 underline">({activeReportView.butcherInCharge.split(',')[0]})</p>
                      <p className="text-[10px]">Staff Butcher On-Duty</p>
                    </div>
                  </div>
                  <div className="space-y-12">
                    <p>Supervisor Toko,</p>
                    <div className="space-y-1">
                      <p className="font-bold text-slate-800">________________________</p>
                      <p className="text-[10px]">Manajer Kontrol Kualitas</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center text-slate-400">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-600">Pratinjau PDF Kosong</p>
              <p className="text-xs mt-1">Silakan ketuk tombol "View Laporan Hari Ini" atau pilih arsip tanggal di sebelah kiri untuk melihat laporan formal.</p>
            </div>
          )}
        </div>
      </div>

      {/* --- CONFIRM CLOSING DIALOG MODAL --- */}
      {isClosingConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-rose-950 text-white p-5">
              <h3 className="text-lg font-bold flex items-center gap-1.5">
                <CheckSquare className="text-rose-500" />
                Konfirmasi Closing Harian?
              </h3>
              <p className="text-rose-200 text-xs mt-1">Langkah ini akan mengunci semua data timbangan berjalan hari ini dan mengarsipkannya.</p>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-red-50 p-4 rounded-xl text-xs text-red-800 space-y-2 border border-red-100">
                <p className="font-bold">⚠️ PENTING UNTUK DIPERHATIKAN:</p>
                <ul className="list-disc pl-4 space-y-1 text-slate-600">
                  <li>Proses pencairan es (Thawing) yang masih berjalan akan dipaksa selesai.</li>
                  <li>Draft PDF hari ini akan disimpan permanen ke dalam tabel arsip.</li>
                  <li>Daftar kerja aktif akan di-reset kosong agar butcher esok hari bisa memulai shift baru tanpa tercampur data kemarin.</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsClosingConfirm(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Kembali
                </button>
                <button
                  onClick={handleConfirmClosing}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  Ya, Lakukan Closing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
