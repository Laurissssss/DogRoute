"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { 
  Building, 
  Users, 
  Dog, 
  TrendingUp, 
  Loader2, 
  CircleDollarSign, 
  ArrowLeft,
  BellRing,
  Award
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const router = useRouter();

  // Data states
  const [totalWalks, setTotalWalks] = useState(0);
  const [ownersCount, setOwnersCount] = useState(0);
  const [walkersCount, setWalkersCount] = useState(0);
  const [platformEarnings, setPlatformEarnings] = useState(0);
  
  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        setIsLoading(true);

        // 1. Fetch user counts by role from profiles
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("role");

        if (profilesError) throw profilesError;

        if (profiles) {
          const owners = profiles.filter((p) => p.role === "owner").length;
          const walkers = profiles.filter((p) => p.role === "walker").length;
          setOwnersCount(owners);
          setWalkersCount(walkers);
        }

        // 2. Fetch all walks to calculate totals and platform commission (15%)
        const { data: walks, error: walksError } = await supabase
          .from("walks")
          .select("commission_fee, status");

        if (walksError) throw walksError;

        if (walks) {
          setTotalWalks(walks.length);
          
          // Calculate platform commissions (15% fee) on completed / paid walks
          const totalFees = walks
            .filter((w) => ["completed", "paid", "ongoing"].includes(w.status))
            .reduce((acc, curr) => acc + parseFloat(curr.commission_fee || 0), 0);
          
          setPlatformEarnings(totalFees);
        }

      } catch (err) {
        console.error("Error loading admin stats:", err);
        setErrorMsg("Error al obtener los datos de la base de datos.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminStats();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 text-violet-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Cargando panel de administración...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0b0f19] text-white font-sans pb-24 select-none">
      {/* Aurora Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-violet-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-amber-500/5 blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        
        {/* Header navigation bar */}
        <div className="flex items-center justify-between border-b border-slate-900/60 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-violet-600/20 border border-violet-500/30 rounded-xl text-violet-400">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Dashboard de Administración</h1>
              <p className="text-xs text-slate-400 mt-1">SaaS DogRoute • Control Global y Métricas Financieras</p>
            </div>
          </div>
          
          <Link 
            href="/"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:border-violet-500 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al Inicio
          </Link>
        </div>

        {/* METRICS ROW CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Platform earnings commission (15%) */}
          <div className="p-5 bg-gradient-to-br from-[#1c2438] to-[#141b2a] border border-slate-800/80 rounded-2xl space-y-2 relative overflow-hidden group">
            <div className="absolute top-4 right-4 text-violet-500 bg-violet-500/10 p-2.5 rounded-xl border border-violet-500/20">
              <CircleDollarSign className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block">Comisiones DogRoute (15%)</span>
            <h3 className="text-2xl font-black text-white pt-2">
              ${platformEarnings.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
              <span className="text-xs font-normal text-violet-400 ml-1">COP</span>
            </h3>
            <p className="text-[9px] text-slate-600">Ingresos netos por mediación de paseos</p>
          </div>

          {/* Users count (owners) */}
          <div className="p-5 bg-gradient-to-br from-[#1c2438] to-[#141b2a] border border-slate-800/80 rounded-2xl space-y-2 relative overflow-hidden group">
            <div className="absolute top-4 right-4 text-emerald-500 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block">Clientes Registrados</span>
            <h3 className="text-2xl font-black text-white pt-2">{ownersCount}</h3>
            <p className="text-[9px] text-slate-600">Dueños de perros registrados en 'profiles'</p>
          </div>

          {/* Users count (walkers) */}
          <div className="p-5 bg-gradient-to-br from-[#1c2438] to-[#141b2a] border border-slate-800/80 rounded-2xl space-y-2 relative overflow-hidden group">
            <div className="absolute top-4 right-4 text-amber-500 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block">Paseadores Activos</span>
            <h3 className="text-2xl font-black text-white pt-2">{walkersCount}</h3>
            <p className="text-[9px] text-slate-600">Paseadores verificados y en servicio</p>
          </div>

          {/* Total walks requests */}
          <div className="p-5 bg-gradient-to-br from-[#1c2438] to-[#141b2a] border border-slate-800/80 rounded-2xl space-y-2 relative overflow-hidden group">
            <div className="absolute top-4 right-4 text-indigo-500 bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20">
              <Dog className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block">Paseos Históricos</span>
            <h3 className="text-2xl font-black text-white pt-2">{totalWalks}</h3>
            <p className="text-[9px] text-slate-600">Total de viajes solicitados en la plataforma</p>
          </div>

        </div>

        {/* VISUAL REPORT CHARTS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Platform Performance graph (simulated) */}
          <div className="md:col-span-2 p-6 bg-[#161c2a]/60 border border-slate-800/80 rounded-3xl space-y-4">
            <h3 className="font-extrabold text-sm text-slate-350 uppercase tracking-wider">Distribución de Rentabilidad</h3>
            
            <div className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Comisión Plataforma (15%)</span>
                  <span className="text-violet-400 font-bold">${(platformEarnings).toLocaleString("es-CO")} COP</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2">
                  <div className="bg-violet-500 h-2 rounded-full" style={{ width: "15%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Ganancias de Paseadores (85%)</span>
                  <span className="text-emerald-450 font-bold">${(platformEarnings / 0.15 * 0.85).toLocaleString("es-CO")} COP</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: "85%" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Quick SaaS logs */}
          <div className="p-6 bg-[#161c2a]/40 border border-slate-800/80 rounded-3xl space-y-3">
            <h3 className="font-extrabold text-sm text-slate-350 uppercase tracking-wider flex items-center gap-1.5">
              <BellRing className="w-4 h-4 text-violet-400" /> Registro de Actividad
            </h3>
            
            <div className="space-y-3 text-[10px] text-slate-500">
              <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-900">
                <span className="text-violet-400 font-bold block mb-0.5">Nuevo Registro</span>
                Un nuevo paseador se ha registrado en 'profiles'.
              </div>
              <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-900">
                <span className="text-emerald-400 font-bold block mb-0.5">Pago Aprobado</span>
                Comisión de plataforma liquidada con éxito.
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
