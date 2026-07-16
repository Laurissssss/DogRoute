"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Dog, 
  Footprints, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";

export default function Register() {
  const router = useRouter();

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("owner"); // 'owner' or 'walker'
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      // Validate inputs
      if (!fullName.trim()) {
        throw new Error("Por favor, ingresa tu nombre completo.");
      }
      if (password.length < 6) {
        throw new Error("La contraseña debe tener al menos 6 caracteres.");
      }

      // 1. Sign up user using Supabase Auth
      // The options.data object contains metadata that is automatically sync'd to the public.profiles
      // table via the database trigger we created (on_auth_user_created).
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            full_name: fullName.trim(),
            role: role,
          },
        },
      });

      if (error) throw error;

      // Supabase returns an active session or a user if successful.
      // If email confirmation is enabled, a user might need to verify their email.
      if (data.user) {
        setIsSuccess(true);
        // Automatically redirect to login or dashboard after a short delay
        setTimeout(() => {
          router.push("/login");
        }, 5000);
      }
    } catch (err) {
      console.error("Error in registration:", err);
      // Translate common Supabase messages to friendly Spanish
      let friendlyMessage = err.message;
      if (err.message.includes("User already registered")) {
        friendlyMessage = "Este correo electrónico ya está registrado.";
      } else if (err.message.includes("Invalid email")) {
        friendlyMessage = "Por favor, ingresa un correo electrónico válido.";
      }
      setErrorMsg(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#0b0f19] px-4 py-12 overflow-hidden font-sans select-none">
      {/* Aurora Ambient Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-violet-600/20 to-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-amber-500/10 to-rose-500/20 blur-[120px] pointer-events-none" />

      {/* Main Glassmorphic Card Container */}
      <div className="relative w-full max-w-md bg-[#161c2a]/70 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-all duration-300">
        
        {/* Logo and Headings */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 mb-3 hover:scale-105 transition-transform duration-200">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider text-slate-300 uppercase">DogRoute</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Crea tu Cuenta
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            El InDriver de los paseadores de perros
          </p>
        </div>

        {isSuccess ? (
          /* SUCCESS STATE VIEW */
          <div className="flex flex-col items-center justify-center py-8 text-center animate-fade-in">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 mb-6 shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">¡Registro completado!</h3>
            <p className="text-slate-300 text-sm max-w-xs mb-4">
              Hemos creado tu cuenta con éxito. Te estamos redirigiendo al inicio de sesión para que comiences tu viaje.
            </p>
            <p className="text-xs text-amber-500 font-medium">
              Por favor, verifica tu correo si el sistema requiere confirmación.
            </p>
            <div className="mt-8 w-full">
              <Link 
                href="/login"
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold transition-all duration-200 shadow-[0_4px_20px_rgba(79,70,229,0.3)]"
              >
                Ir a Iniciar Sesión <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* FORM VIEW */
          <form onSubmit={handleRegister} className="space-y-6">
            
            {/* Error Notification */}
            {errorMsg && (
              <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm animate-shake">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* Input: Full Name */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Nombre Completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-900/60 border border-slate-800/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all duration-200 text-sm"
                />
              </div>
            </div>

            {/* Input: Email */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="tucorreo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-900/60 border border-slate-800/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all duration-200 text-sm"
                />
              </div>
            </div>

            {/* Input: Password */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3.5 bg-slate-900/60 border border-slate-800/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all duration-200 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Input: Role Selector Card Option */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                ¿Cuál es tu rol?
              </label>
              <div className="grid grid-cols-2 gap-4">
                
                {/* Owner Card Option */}
                <button
                  type="button"
                  onClick={() => setRole("owner")}
                  className={`relative flex flex-col items-center text-center p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                    role === "owner"
                      ? "bg-violet-600/10 border-violet-500/80 shadow-[0_0_15px_rgba(124,58,237,0.2)] text-white scale-[1.02]"
                      : "bg-slate-900/30 border-slate-800 text-slate-400 hover:bg-slate-900/50 hover:border-slate-700/60"
                  }`}
                >
                  <div className={`p-2.5 rounded-xl mb-3 transition-colors ${
                    role === "owner" ? "bg-violet-500/20 text-violet-400" : "bg-slate-800 text-slate-500"
                  }`}>
                    <Dog className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-bold block mb-1">Dueño de Perro</span>
                  <span className="text-[10px] leading-tight text-slate-500 px-1">Busco paseadores de confianza</span>
                  {role === "owner" && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-violet-500" />
                  )}
                </button>

                {/* Walker Card Option */}
                <button
                  type="button"
                  onClick={() => setRole("walker")}
                  className={`relative flex flex-col items-center text-center p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                    role === "walker"
                      ? "bg-amber-500/10 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.2)] text-white scale-[1.02]"
                      : "bg-slate-900/30 border-slate-800 text-slate-400 hover:bg-slate-900/50 hover:border-slate-700/60"
                  }`}
                >
                  <div className={`p-2.5 rounded-xl mb-3 transition-colors ${
                    role === "walker" ? "bg-amber-500/20 text-amber-400" : "bg-slate-800 text-slate-500"
                  }`}>
                    <Footprints className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-bold block mb-1">Quiero Pasear</span>
                  <span className="text-[10px] leading-tight text-slate-500 px-1">Ofrezco mis servicios de paseo</span>
                  {role === "walker" && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500" />
                  )}
                </button>

              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold transition-all duration-200 shadow-[0_4px_20px_rgba(79,70,229,0.35)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Registrando...
                </>
              ) : (
                <>
                  Registrarse <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Redirect link */}
            <div className="text-center pt-2">
              <span className="text-sm text-slate-400">¿Ya tienes cuenta? </span>
              <Link 
                href="/login" 
                className="text-sm text-violet-400 hover:text-violet-300 font-semibold underline underline-offset-4 transition-colors"
              >
                Inicia sesión
              </Link>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}
