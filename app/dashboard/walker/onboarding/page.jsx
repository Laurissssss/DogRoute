"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { 
  ScrollText, 
  CircleDollarSign, 
  Dog, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Info 
} from "lucide-react";

export default function WalkerOnboarding() {
  const router = useRouter();

  // Form states
  const [biography, setBiography] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [allowedSizes, setAllowedSizes] = useState([]); // array containing: 'small', 'medium', 'large'
  
  // UI states
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Get current user session on load
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Redirigir a login si no hay sesión activa
        router.push("/login");
      } else {
        setUserId(user.id);
      }
    };
    fetchUser();
  }, [router]);

  const toggleSize = (sizeValue) => {
    if (allowedSizes.includes(sizeValue)) {
      setAllowedSizes(allowedSizes.filter((s) => s !== sizeValue));
    } else {
      setAllowedSizes([...allowedSizes, sizeValue]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      setErrorMsg("No se encontró una sesión activa de usuario. Vuelve a iniciar sesión.");
      return;
    }
    if (!biography.trim()) {
      setErrorMsg("Por favor, escribe una breve presentación profesional.");
      return;
    }
    if (!hourlyRate || parseFloat(hourlyRate) <= 0) {
      setErrorMsg("Por favor, ingresa una tarifa base por hora válida.");
      return;
    }
    if (allowedSizes.length === 0) {
      setErrorMsg("Por favor, selecciona al menos un tamaño de perro que puedas pasear.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      // 1. Update walker profile with custom columns: bio, hourly_rate, allowed_sizes
      // IMPORTANT: Ensure you have run the ALTER TABLE sql migration to add these columns.
      const { error } = await supabase
        .from("profiles")
        .update({
          bio: biography.trim(),
          hourly_rate: parseFloat(hourlyRate),
          allowed_sizes: allowedSizes,
        })
        .eq("id", userId);

      if (error) {
        // Check if columns exist error (PostgREST 42703 is Column Not Found)
        if (error.code === "42703") {
          throw new Error("Columnas faltantes en la base de datos. Asegúrate de ejecutar el script ALTER TABLE en tu SQL Editor de Supabase.");
        }
        throw error;
      }

      setSuccessMsg("¡Perfil profesional configurado! Redirigiendo a tu panel...");
      
      // 2. Redirect to dashboard walker
      setTimeout(() => {
        router.push("/dashboard/walker");
      }, 2000);

    } catch (err) {
      console.error("Error saving walker onboarding:", err);
      setErrorMsg(err.message || "Ocurrió un error al guardar tu perfil. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#0b0f19] px-4 py-12 overflow-hidden font-sans select-none">
      {/* Aurora Ambient Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-violet-600/20 to-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-amber-500/10 to-emerald-500/20 blur-[120px] pointer-events-none" />

      {/* Main Glassmorphic Card Container */}
      <div className="relative w-full max-w-lg bg-[#161c2a]/70 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-all duration-300">
        
        {/* Onboarding Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 mb-3 hover:scale-105 transition-transform duration-200">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider text-slate-300 uppercase">Configuración de Paseador</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Completa tu Perfil
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Configura tu presentación y tarifas para empezar a recibir ofertas de paseos
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Success Notification */}
          {successMsg && (
            <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm animate-fade-in">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Notification */}
          {errorMsg && (
            <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* Biography */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Biografía y Presentación Profesional
              </label>
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <ScrollText className="w-3.5 h-3.5" /> Mínimo 20 caracteres
              </span>
            </div>
            <textarea
              required
              placeholder="Cuéntales a los dueños sobre tu experiencia paseando perros, tu amor por los animales y tu disponibilidad..."
              rows={4}
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-900/60 border border-slate-800/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all duration-200 text-sm resize-none"
            />
          </div>

          {/* Hourly Rate */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Tarifa Base por Hora
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <CircleDollarSign className="w-5 h-5 text-amber-500" />
              </div>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="Ej. 15.00 (Tarifa en USD / Moneda local)"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-900/60 border border-slate-800/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all duration-200 text-sm"
              />
            </div>
          </div>

          {/* Dog Size checkboxes */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              ¿Qué tamaños de perro puedes pasear?
            </label>
            <div className="grid grid-cols-3 gap-3">
              
              {/* Small size checkbox pill */}
              <button
                type="button"
                onClick={() => toggleSize("small")}
                className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  allowedSizes.includes("small")
                    ? "bg-amber-500/10 border-amber-500 text-white scale-[1.02] shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                    : "bg-slate-900/30 border-slate-800 text-slate-400 hover:bg-slate-900/50 hover:border-slate-700/60"
                }`}
              >
                <Dog className="w-4 h-4 mb-2 text-amber-500 scale-75" />
                <span className="text-xs font-bold block">Pequeño</span>
                <span className="text-[9px] text-slate-500 mt-0.5">Menos de 10kg</span>
              </button>

              {/* Medium size checkbox pill */}
              <button
                type="button"
                onClick={() => toggleSize("medium")}
                className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  allowedSizes.includes("medium")
                    ? "bg-amber-500/10 border-amber-500 text-white scale-[1.02] shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                    : "bg-slate-900/30 border-slate-800 text-slate-400 hover:bg-slate-900/50 hover:border-slate-700/60"
                }`}
              >
                <Dog className="w-5 h-5 mb-1.5 text-amber-500" />
                <span className="text-xs font-bold block">Mediano</span>
                <span className="text-[9px] text-slate-500 mt-0.5">10kg a 25kg</span>
              </button>

              {/* Large size checkbox pill */}
              <button
                type="button"
                onClick={() => toggleSize("large")}
                className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  allowedSizes.includes("large")
                    ? "bg-amber-500/10 border-amber-500 text-white scale-[1.02] shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                    : "bg-slate-900/30 border-slate-800 text-slate-400 hover:bg-slate-900/50 hover:border-slate-700/60"
                }`}
              >
                <Dog className="w-6 h-6 mb-1 text-amber-500 scale-110" />
                <span className="text-xs font-bold block">Grande</span>
                <span className="text-[9px] text-slate-500 mt-0.5">Más de 25kg</span>
              </button>

            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !userId}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold transition-all duration-200 shadow-[0_4px_20px_rgba(245,158,11,0.3)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Guardando tu configuración...
              </>
            ) : (
              <>
                Finalizar Configuración <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}
