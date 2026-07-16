"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { 
  User, 
  Mail, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft,
  Save 
} from "lucide-react";
import Link from "next/link";

export default function OwnerProfileEdit() {
  const router = useRouter();

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  
  // UI states
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const fetchOwnerData = async () => {
      try {
        setIsLoading(true);
        // Get user session
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push("/login");
          return;
        }
        setUserId(user.id);
        setEmail(user.email || "");

        // Fetch current profile fields
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;

        if (profile) {
          setFullName(profile.full_name || "");
        }
      } catch (err) {
        console.error("Error fetching owner profile:", err);
        setErrorMsg("Error al cargar la información del perfil.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOwnerData();
  }, [router]);

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!userId) return;
    if (!fullName.trim()) {
      setErrorMsg("El nombre completo no puede estar vacío.");
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
          full_name: fullName.trim()
        })
        .eq("id", userId);

      if (error) throw error;

      setSuccessMsg("¡Perfil actualizado con éxito!");
      
      setTimeout(() => {
        setSuccessMsg("");
      }, 3000);

    } catch (err) {
      console.error("Error updating owner profile:", err);
      setErrorMsg("Ocurrió un error al intentar guardar los cambios.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 text-violet-555 animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Cargando información del perfil...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0b0f19] text-white font-sans pb-24 select-none">
      {/* Aurora Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-violet-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-amber-500/5 blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        
        {/* Header navigation bar */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/owner"
            className="p-3 bg-[#161c2a]/50 hover:bg-[#1e273b] border border-slate-800 rounded-xl transition-all text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              Editar Perfil
            </h1>
            <p className="text-xs text-slate-400 mt-1">Actualiza tus datos personales en la plataforma</p>
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
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
                />
              </div>
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-350 uppercase tracking-wider block">
                  Correo Electrónico
                </label>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">No modificable</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-650">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  readOnly
                  disabled
                  value={email}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-950/60 border border-slate-900 rounded-xl text-slate-500 cursor-not-allowed text-sm"
                />
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black tracking-wider uppercase text-xs transition-all shadow-md disabled:opacity-50"
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
