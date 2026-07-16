"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { 
  TrendingUp, 
  CircleDollarSign, 
  ArrowUpRight, 
  Clock, 
  ArrowLeft, 
  Loader2, 
  AlertCircle, 
  Smartphone, 
  X,
  CheckCircle2 
} from "lucide-react";
import Link from "next/link";

export default function WalkerWallet() {
  const router = useRouter();

  // Data states
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [userId, setUserId] = useState(null);
  const [nequiAccount, setNequiAccount] = useState("");
  
  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempNequiPhone, setTempNequiPhone] = useState("");
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Simulated withdrawal history
  const [withdrawals, setWithdrawals] = useState([
    { id: 1, date: "12 Jul 2026", amount: 45000, status: "completed", account: "Nequi: 312***5678" },
    { id: 2, date: "05 Jul 2026", amount: 98000, status: "completed", account: "Nequi: 312***5678" },
    { id: 3, date: "28 Jun 2026", amount: 32000, status: "completed", account: "Nequi: 312***5678" }
  ]);

  useEffect(() => {
    const fetchFinancials = async () => {
      try {
        setIsLoading(true);
        // Get user session
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push("/login");
          return;
        }
        setUserId(user.id);

        // Fetch completed walks earnings
        const { data: walksData, error: walksError } = await supabase
          .from("walks")
          .select("walker_earnings, status")
          .eq("walker_id", user.id);

        if (walksError) throw walksError;

        if (walksData) {
          const completedSum = walksData
            .filter((w) => w.status === "completed")
            .reduce((acc, curr) => acc + parseFloat(curr.walker_earnings || 0), 0);
          
          const pendingSum = walksData
            .filter((w) => ["paid", "ongoing", "accepted"].includes(w.status))
            .reduce((acc, curr) => acc + parseFloat(curr.walker_earnings || 0), 0);

          setTotalEarnings(completedSum);
          setPendingBalance(pendingSum);
        }

        // Check if phone number exists in profiles to prefill withdrawal account
        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", user.id)
          .single();

        // Simulate a Nequi account link based on profile metadata or local storage for the MVP
        const savedAccount = localStorage.getItem(`nequi_account_${user.id}`);
        if (savedAccount) {
          setNequiAccount(savedAccount);
          setTempNequiPhone(savedAccount);
        }

      } catch (err) {
        console.error("Error loading financials:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFinancials();
  }, [router]);

  const handleSaveNequi = (e) => {
    e.preventDefault();
    if (tempNequiPhone.length !== 10) {
      setErrorMsg("Ingresa un número de celular de 10 dígitos válido.");
      return;
    }
    
    setIsSavingAccount(true);
    setErrorMsg("");

    try {
      localStorage.setItem(`nequi_account_${userId}`, tempNequiPhone);
      setNequiAccount(tempNequiPhone);
      setSuccessMsg("¡Cuenta de Nequi guardada!");
      
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMsg("");
      }, 1000);

    } catch (err) {
      setErrorMsg("No se pudo guardar la configuración.");
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleWithdraw = () => {
    if (!nequiAccount) {
      alert("Por favor vincula tu cuenta de Nequi antes de retirar.");
      setIsModalOpen(true);
      return;
    }
    if (totalEarnings <= 0) {
      alert("No tienes fondos suficientes disponibles para retirar.");
      return;
    }

    // Add new withdrawal record to local state
    const newRecord = {
      id: Date.now(),
      date: new Date().toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }),
      amount: totalEarnings,
      status: "processing",
      account: `Nequi: ${nequiAccount.substring(0, 3)}***${nequiAccount.substring(7)}`
    };

    setWithdrawals([newRecord, ...withdrawals]);
    setTotalEarnings(0); // clear simulated available balance
    alert("¡Retiro solicitado! El procesamiento demora hasta 24 horas hábiles.");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Cargando datos financieros...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0b0f19] text-white font-sans pb-24 select-none">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-emerald-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-violet-600/5 blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        
        {/* Header navigation bar */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/walker"
            className="p-3 bg-[#161c2a]/50 hover:bg-[#1e273b] border border-slate-800 rounded-xl transition-all text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <CircleDollarSign className="w-6 h-6 text-emerald-500" /> Mi Billetera
            </h1>
            <p className="text-xs text-slate-400 mt-1">Administra tus ganancias y configura tu cuenta de retiro</p>
          </div>
        </div>

        {/* FINANCIAL SUMMARY BALANCES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Available balance card */}
          <div className="md:col-span-2 p-6 bg-gradient-to-br from-[#1c2438] to-[#141b2a] border border-slate-800/80 rounded-2xl flex flex-col justify-between space-y-4">
            <div>
              <span className="text-[10px] text-emerald-450 uppercase font-black tracking-widest block">
                Saldo Disponible
              </span>
              <h3 className="text-4xl font-extrabold text-white mt-1">
                ${totalEarnings.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                <span className="text-xs font-normal text-emerald-400 ml-1">COP</span>
              </h3>
            </div>
            
            <button
              onClick={handleWithdraw}
              disabled={totalEarnings <= 0}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 py-3 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0b0f19] text-xs font-extrabold transition-all shadow-md shadow-emerald-500/10 disabled:opacity-50"
            >
              Retirar Fondos <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Pending / Escrow balance card */}
          <div className="p-6 bg-[#161c2a]/50 border border-slate-800/80 rounded-2xl flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">
                Garantía en Progreso
              </span>
              <h3 className="text-xl font-bold text-slate-350 mt-2">
                ${pendingBalance.toLocaleString("es-CO")}
              </h3>
              <p className="text-[9px] text-slate-600 mt-1">Paseos en curso o programados que se liquidarán al completar el servicio</p>
            </div>
          </div>
        </div>

        {/* ACCOUNT CONFIGURATION & WITHDRAWALS LIST */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
          
          {/* LEFT: NEQUI WITHDRAW CONFIGURATION (COL SPAN 2) */}
          <div className="md:col-span-2 p-5 bg-[#161c2a]/40 border border-slate-800/80 rounded-2xl space-y-4">
            <h3 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider">Cuenta de Retiro</h3>
            
            {nequiAccount ? (
              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-550">Vinculado a Nequi</p>
                  <p className="text-xs font-bold text-white">
                    3** *** {nequiAccount.substring(7)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-rose-500/5 border border-rose-550/20 text-rose-450 rounded-xl text-xs flex flex-col items-center text-center">
                <AlertCircle className="w-5 h-5 mb-2 animate-bounce" />
                No has vinculado una cuenta de retiro para transferir tus fondos.
              </div>
            )}

            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
            >
              {nequiAccount ? "Cambiar Cuenta Nequi" : "Configurar Cuenta Nequi"}
            </button>
          </div>

          {/* RIGHT: MOCK WITHDRAW TRANSACTION LIST (COL SPAN 3) */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider">Historial de Retiros</h3>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {withdrawals.map((item) => (
                <div 
                  key={item.id}
                  className="p-3.5 bg-[#161c2a]/30 border border-slate-850 rounded-xl flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white">${item.amount.toLocaleString("es-CO")} COP</p>
                    <p className="text-[9px] text-slate-500">{item.date} • {item.account}</p>
                  </div>
                  
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${
                    item.status === "completed" 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
                  }`}>
                    {item.status === "completed" ? "Aprobado" : "Procesando"}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* NEQUI CONFIGURATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-sm bg-[#161c2a] border border-slate-800 rounded-3xl p-6 shadow-2xl animate-fade-in">
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-extrabold text-sm text-white">Configurar Retiro Nequi</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNequi} className="space-y-4">
              {successMsg && (
                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-455 rounded-xl text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-450 uppercase block">
                  Celular de tu Cuenta Nequi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Smartphone className="w-4 h-4 text-emerald-500" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength="10"
                    placeholder="Ej. 3123456789"
                    value={tempNequiPhone}
                    onChange={(e) => setTempNequiPhone(e.target.value.replace(/\D/g, ""))}
                    className="w-full pl-9 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-650 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingAccount}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black tracking-wider uppercase text-xs transition-all duration-200"
              >
                {isSavingAccount ? "Guardando..." : "Vincular Cuenta"}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
