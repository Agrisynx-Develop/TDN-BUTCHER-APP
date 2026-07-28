import React, { useState } from 'react';
import { ButcherAccount } from '../types';
import { User, UserPlus, Shield, UserCheck, Trash2, AlertCircle } from 'lucide-react';

interface AccountManagerProps {
  accounts: ButcherAccount[];
  activeAccount: ButcherAccount | null;
  onSelectAccount: (id: string) => void;
  onAddAccount: (name: string, role: ButcherAccount['role']) => void;
}

export default function AccountManager({
  accounts,
  activeAccount,
  onSelectAccount,
  onAddAccount,
}: AccountManagerProps) {
  const [newButcherName, setNewButcherName] = useState('');
  const [role, setRole] = useState<ButcherAccount['role']>('Butcher');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newButcherName.trim()) {
      setErrorMsg('Nama butcher tidak boleh kosong!');
      return;
    }

    if (accounts.some((a) => a.name.toLowerCase() === newButcherName.trim().toLowerCase())) {
      setErrorMsg('Nama butcher ini sudah terdaftar!');
      return;
    }

    onAddAccount(newButcherName.trim(), role);
    setNewButcherName('');
    setRole('Butcher');
    setSuccessMsg('Akun Butcher baru berhasil disimpan!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          👥 Sistem Akun Tersimpan
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Pilih profil Anda untuk mencatat siapa yang melakukan penimbangan dan pemotongan daging.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Switch Account (Col-7) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">
            Daftar Butcher Terdaftar ({accounts.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {accounts.map((acc) => {
              const isActive = activeAccount?.id === acc.id;

              return (
                <button
                  key={acc.id}
                  onClick={() => onSelectAccount(acc.id)}
                  className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block text-sm leading-tight">{acc.name}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{acc.role}</span>
                    </div>
                  </div>

                  {isActive && (
                    <span className="p-1 bg-emerald-600 text-white rounded-full">
                      <UserCheck className="w-3.5 h-3.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Add New Account Form (Col-5) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <UserPlus className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Tambah Akun Butcher</h3>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 flex items-start gap-1">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-100 flex items-start gap-1">
                  <UserCheck className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nama Butcher Lengkap *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Butcher Ahmad"
                  value={newButcherName}
                  onChange={(e) => setNewButcherName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Jabatan / Akses Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Butcher', 'Supervisor', 'Admin'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2 text-xs font-semibold rounded-lg border cursor-pointer text-center transition-all ${
                        role === r
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all shadow-xs cursor-pointer"
              >
                Simpan Profil Butcher
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-[11px] text-slate-500 leading-relaxed text-center font-medium">
              ✨ <em>Data penimbangan, pabrikasi, dan profil butcher otomatis tersimpan langsung secara real-time ke database. Saat Anda login kembali atau ganti perangkat, data tetap tersimpan aman.</em>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
