"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { 
  User, 
  ScrollText, 
  CircleDollarSign, 
  Dog, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft,
  Save 
} from "lucide-react";
import Link from "next/link";

export default function WalkerProfileEdit() {
  const router = useRouter();

  // Form states
  const [fullName, setFullName] = useState("");
  const [biography, setBiography] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [allowedSizes, setAllowedSizes] = useState([]);
  
  // UI states
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const fetchWalkerData = async () => {
      try {
        setIsLoading(true);
        // Get user session
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push("/login");
          return;
        }
        setUserId(user.id);

        // Fetch current profile fields
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;

        if (profile) {
          setFullName(profile.full_name || "");
          setBiography(profile.bio || "");
          setHourlyRate(profile.hourly_rate ? profile.hourly_rate.toString() : "");
          setAllowedSizes(profile.allowed_sizes || []);
        }
      } catch (err) {
        console.error("Error fetching walker profile:", err);
        setErrorMsg("Error al cargar la información del perfil.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWalkerData();
  }, [router]);

  const toggleSize = (sizeValue) => {
    if (allowedSizes.includes(sizeValue)) {
      setAllowedSizes(allowedSizes.filter((s) => s !== sizeValue));
    } else {
      setAllowedSizes([...allowedSizes, sizeValue]);
    }
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!userId) return;
    if (!fullName.trim()) {
      setErrorMsg("El nombre completo no puede estar vacío.");
      return;
    }
    if (!biography.trim()) {
      setErrorMsg("Por favor, escribe una breve presentación.");
      return;
    }
    if (!hourlyRate || parseFloat(hourlyRate) < 0) {
      setErrorMsg("Ingresa una tarifa válida por hora.");
      return;
    }
    if (allowedSizes.length === 0) {
      setErrorMsg("Selecciona al menos un tamaño de perro que puedas pasear.");
      return;
    }

    setIsSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // Update public.profiles table
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          bio: biography.trim(),
          hourly_rate: parseFloat(hourlyRate),
          allowed_sizes: allowedSizes,
        })
        .eq("id", userId);

      if (error) throw error;

      setSuccessMsg("¡Perfil actualizado con éxito!");
      
      setTimeout(() => {
        setSuccessMsg("");
      }, 3000);

    } catch (err) {
      console.error("Error updating walker profile:", err);
      setErrorMsg("Ocurrió un error al intentar guardar los cambios.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 text-emerald-550 animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Cargando información del perfil...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0b0f19] text-white font-sans pb-24 select-none">
      {/* Aurora Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-emerald-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-violet-600/5 blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        
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
              Editar Perfil Profesional
            </h1>
            <p className="text-xs text-slate-400 mt-1">Actualiza tus datos y tarifas visibles para los dueños</p>
          </div>
        </div>

        {/* Edit profile form card */}
        <div className="bg-[#161c2a]/60 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md shadow-lg">
          <form onSubmit={handleSaveChanges} className="space-y-6">
            
            {/* Success alert */}
            {successMsg && (
              <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm animate-fade-in">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Error alert */}
            {errorMsg && (
              <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm animate-shake">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-350 uppercase tracking-wider block">
                Nombre Completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
                />
              </div>
            </div>

            {/* Biography */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-350 uppercase tracking-wider block">
                Biografía y Presentación Profesional
              </label>
              <div className="relative">
                <div className="absolute top-3.5 left-3.5 text-slate-500 pointer-events-none">
                  <ScrollText className="w-5 h-5" />
                </div>
                <textarea
                  required
                  rows={4}
                  value={biography}
                  onChange={(e) => setBiography(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm resize-none"
                />
              </div>
            </div>

            {/* Hourly Rate */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-350 uppercase tracking-wider block">
                Tarifa Base por Hora
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <CircleDollarSign className="w-5 h-5 text-emerald-500" />
                </div>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
                />
              </div>
            </div>

            {/* Dog Size preferences selection */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-355 uppercase tracking-wider block">
                ¿Qué tamaños de perro puedes pasear?
              </label>
              <div className="grid grid-cols-3 gap-3">
                
                {/* Small */}
                <button
                  type="button"
                  onClick={() => toggleSize("small")}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    allowedSizes.includes("small")
                      ? "bg-emerald-500/10 border-emerald-500 text-white scale-[1.02] shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                      : "bg-slate-900/30 border-slate-800 text-slate-400 hover:bg-slate-900/50 hover:border-slate-700/60"
                  }`}
                >
                  <Dog className="w-4 h-4 mb-2 text-emerald-450 scale-75" />
                  <span className="text-xs font-bold block">Pequeño</span>
                </button>

                {/* Medium */}
                <button
                  type="button"
                  onClick={() => toggleSize("medium")}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    allowedSizes.includes("medium")
                      ? "bg-emerald-500/10 border-emerald-500 text-white scale-[1.02] shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                      : "bg-slate-900/30 border-slate-800 text-slate-400 hover:bg-slate-900/50 hover:border-slate-700/60"
                  }`}
                >
                  <Dog className="w-5 h-5 mb-1.5 text-emerald-450" />
                  <span className="text-xs font-bold block">Mediano</span>
                </button>

                {/* Large */}
                <button
                  type="button"
                  onClick={() => toggleSize("large")}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    allowedSizes.includes("large")
                      ? "bg-emerald-500/10 border-emerald-500 text-white scale-[1.02] shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                      : "bg-slate-900/30 border-slate-800 text-slate-400 hover:bg-slate-900/50 hover:border-slate-700/60"
                  }`}
                >
                  <Dog className="w-6 h-6 mb-1 text-emerald-450 scale-110" />
                  <span className="text-xs font-bold block">Grande</span>
                </button>

              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black tracking-wider uppercase text-xs transition-all shadow-md disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Guardar Cambios
                </>
              )}
            </button>

          </form>
        </div>

      </div>
    </div>
  );
}
