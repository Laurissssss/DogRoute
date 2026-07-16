"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { 
  Dog, 
  Sparkles, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Info 
} from "lucide-react";

export default function OwnerOnboarding() {
  const router = useRouter();

  // Form states
  const [dogName, setDogName] = useState("");
  const [breed, setBreed] = useState("");
  const [size, setSize] = useState("medium"); // default to medium
  const [temperament, setTemperament] = useState("");
  
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      setErrorMsg("No se encontró una sesión activa de usuario. Vuelve a iniciar sesión.");
      return;
    }
    if (!dogName.trim()) {
      setErrorMsg("Por favor, ingresa el nombre de tu mascota.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      // 1. Insert dog into the dogs table
      const { error } = await supabase.from("dogs").insert({
        owner_id: userId,
        name: dogName.trim(),
        breed: breed.trim() || "Mestizo",
        size: size,
        temperament: temperament.trim() || "Amigable",
      });

      if (error) throw error;

      setSuccessMsg("¡Mascota registrada con éxito! Redirigiendo a tu panel...");
      
      // 2. Redirect to dashboard owner
      setTimeout(() => {
        router.push("/dashboard/owner");
      }, 2000);

    } catch (err) {
      console.error("Error saving dog:", err);
      setErrorMsg("Ocurrió un error al guardar los datos de tu perro. Inténtalo de nuevo.");
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
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider text-slate-300 uppercase">Paso 1: Onboarding</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            ¡Registra a tu Mascota!
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Necesitamos los datos de tu mejor amigo para conectarte con el paseador ideal
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

          {/* Grid for Name & Breed */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Dog Name */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Nombre del Perro
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Bruno"
                value={dogName}
                onChange={(e) => setDogName(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-900/60 border border-slate-800/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all duration-200 text-sm"
              />
            </div>

            {/* Breed */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Raza (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej. Golden Retriever"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-900/60 border border-slate-800/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all duration-200 text-sm"
              />
            </div>
          </div>

          {/* Size Visual Selector */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Tamaño de la Mascota
            </label>
            <div className="grid grid-cols-3 gap-3">
              
              {/* Small size option */}
              <button
                type="button"
                onClick={() => setSize("small")}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  size === "small"
                    ? "bg-violet-600/10 border-violet-500/85 text-white scale-[1.02] shadow-[0_0_12px_rgba(124,58,237,0.15)]"
                    : "bg-slate-900/30 border-slate-800 text-slate-400 hover:bg-slate-900/50 hover:border-slate-700/60"
                }`}
              >
                <Dog className="w-5 h-5 mb-2 text-violet-400 scale-75" />
                <span className="text-xs font-bold block">Pequeño</span>
                <span className="text-[9px] text-slate-500 mt-0.5">Menos de 10kg</span>
              </button>

              {/* Medium size option */}
              <button
                type="button"
                onClick={() => setSize("medium")}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  size === "medium"
                    ? "bg-violet-600/10 border-violet-500/85 text-white scale-[1.02] shadow-[0_0_12px_rgba(124,58,237,0.15)]"
                    : "bg-slate-900/30 border-slate-800 text-slate-400 hover:bg-slate-900/50 hover:border-slate-700/60"
                }`}
              >
                <Dog className="w-6 h-6 mb-1 text-violet-400" />
                <span className="text-xs font-bold block">Mediano</span>
                <span className="text-[9px] text-slate-500 mt-0.5">10kg a 25kg</span>
              </button>

              {/* Large size option */}
              <button
                type="button"
                onClick={() => setSize("large")}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  size === "large"
                    ? "bg-violet-600/10 border-violet-500/85 text-white scale-[1.02] shadow-[0_0_12px_rgba(124,58,237,0.15)]"
                    : "bg-slate-900/30 border-slate-800 text-slate-400 hover:bg-slate-900/50 hover:border-slate-700/60"
                }`}
              >
                <Dog className="w-7 h-7 mb-0.5 text-violet-400 scale-110" />
                <span className="text-xs font-bold block">Grande</span>
                <span className="text-[9px] text-slate-500 mt-0.5">Más de 25kg</span>
              </button>

            </div>
          </div>

          {/* Temperament input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Temperamento
              </label>
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <Info className="w-3 h-3" /> Ej: Juguetón, nervioso, tranquilo, etc.
              </span>
            </div>
            <textarea
              placeholder="¿Cómo es tu perro con los paseadores y otras mascotas?"
              rows={3}
              value={temperament}
              onChange={(e) => setTemperament(e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-900/60 border border-slate-800/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all duration-200 text-sm resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !userId}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold transition-all duration-200 shadow-[0_4px_20px_rgba(79,70,229,0.35)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Guardando perfil de mascota...
              </>
            ) : (
              <>
                Guardar y Continuar <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}
