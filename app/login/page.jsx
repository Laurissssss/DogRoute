"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  CheckCircle2 
} from "lucide-react";

export default function Login() {
  const router = useRouter();

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // 1. Sign in with password using Supabase Auth
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (data.user) {
        setSuccessMsg("¡Sesión iniciada con éxito! Redirigiendo...");

        // 2. Fetch user's role from the public.profiles table
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        let targetRole = "owner"; // Default fallback

        if (profileError) {
          console.warn("Could not fetch profile role. Falling back to user metadata:", profileError);
          // Fallback to user metadata in auth if profiles query fails
          if (data.user.user_metadata?.role) {
            targetRole = data.user.user_metadata.role;
          }
        } else if (profile && profile.role) {
          targetRole = profile.role;
        }

        // 3. Smart redirection based on role
        setTimeout(() => {
          if (targetRole === "walker") {
            router.push("/dashboard/walker");
          } else {
            router.push("/dashboard/owner");
          }
        }, 1500);
      }
    } catch (err) {
      console.error("Error in login:", err);
      // Friendly messages in Spanish for common Auth errors
      let friendlyMessage = err.message;
      if (err.message.includes("Invalid login credentials")) {
        friendlyMessage = "Correo o contraseña incorrectos. Por favor, verifica tus datos.";
      } else if (err.message.includes("Email not confirmed")) {
        friendlyMessage = "Por favor, confirma tu correo electrónico antes de iniciar sesión.";
      }
      setErrorMsg(friendlyMessage);
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
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider text-slate-300 uppercase">DogRoute</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            ¡Hola de nuevo!
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Inicia sesión para continuar tu ruta
          </p>
        </div>

        {/* Form View */}
        <form onSubmit={handleLogin} className="space-y-6">
          
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
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Contraseña
              </label>
              {/* Optional: Forgot password link placeholder */}
              <span className="text-xs text-slate-500 hover:text-slate-400 cursor-pointer transition-colors">
                ¿La olvidaste?
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Ingresa tu contraseña"
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold transition-all duration-200 shadow-[0_4px_20px_rgba(79,70,229,0.35)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Iniciando Sesión...
              </>
            ) : (
              <>
                Iniciar Sesión <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {/* Redirect link */}
          <div className="text-center pt-2">
            <span className="text-sm text-slate-400">¿No tienes cuenta? </span>
            <Link 
              href="/register" 
              className="text-sm text-violet-400 hover:text-violet-300 font-semibold underline underline-offset-4 transition-colors"
            >
              Regístrate aquí
            </Link>
          </div>

        </form>
      </div>
    </div>
  );
}
