import Link from "next/link";
import { 
  Dog, 
  ShieldCheck, 
  MapPin, 
  Star, 
  ArrowRight, 
  Compass, 
  TrendingUp, 
  Users 
} from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#0b0f19] text-white overflow-hidden font-sans select-none flex flex-col justify-between">
      {/* Aurora Ambient Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-violet-600/15 to-indigo-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-amber-500/5 to-rose-500/15 blur-[130px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between border-b border-slate-900/60">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-white font-bold shadow-lg shadow-violet-600/30">
            <Dog className="w-5 h-5" />
          </div>
          <span className="text-lg font-black tracking-wider bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            DogRoute
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <Link 
            href="/login"
            className="text-sm font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Iniciar Sesión
          </Link>
          <Link 
            href="/register"
            className="px-4 py-2 text-xs font-bold uppercase bg-slate-950 border border-slate-800 rounded-xl hover:border-violet-500 transition-all"
          >
            Registrarme
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center text-center flex-1 space-y-12">
        
        {/* Value Prop Banner */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:scale-105 transition-transform duration-200 cursor-pointer">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-[10px] font-bold tracking-widest text-slate-300 uppercase">
            El InDriver de los paseos caninos
          </span>
        </div>

        {/* Heading Titles */}
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none bg-gradient-to-b from-white via-slate-100 to-slate-500 bg-clip-text text-transparent">
            Tú propones la tarifa. <br />
            Tu mascota disfruta del paseo.
          </h1>
          <p className="text-base sm:text-lg text-slate-450 max-w-2xl mx-auto leading-relaxed">
            La plataforma líder que conecta a dueños de mascotas con paseadores locales bajo un modelo de negociación libre y rastreo GPS en tiempo real.
          </p>
        </div>

        {/* Giant CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <Link 
            href="/register"
            className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm transition-all duration-200 shadow-xl shadow-violet-600/20 hover:-translate-y-0.5"
          >
            Registrarme Gratis <ArrowRight className="w-4 h-4" />
          </Link>
          <Link 
            href="/login"
            className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-bold text-sm transition-all duration-200 hover:-translate-y-0.5"
          >
            Iniciar Sesión
          </Link>
        </div>

        {/* Dynamic Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-4xl pt-16">
          <div className="p-4 bg-[#161c2a]/40 border border-slate-900 rounded-2xl">
            <h3 className="text-2xl sm:text-3xl font-black text-white">5,000+</h3>
            <p className="text-[10px] text-slate-550 uppercase font-bold tracking-wider mt-1">Paseos Exitosos</p>
          </div>
          <div className="p-4 bg-[#161c2a]/40 border border-slate-900 rounded-2xl">
            <h3 className="text-2xl sm:text-3xl font-black text-amber-500 flex items-center justify-center gap-1">
              4.9 <Star className="w-5 h-5 fill-amber-500 text-amber-500 shrink-0" />
            </h3>
            <p className="text-[10px] text-slate-550 uppercase font-bold tracking-wider mt-1">Valoración Media</p>
          </div>
          <div className="p-4 bg-[#161c2a]/40 border border-slate-900 rounded-2xl">
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-450">15 min</h3>
            <p className="text-[10px] text-slate-550 uppercase font-bold tracking-wider mt-1">Tiempo de Respuesta</p>
          </div>
          <div className="p-4 bg-[#161c2a]/40 border border-slate-900 rounded-2xl">
            <h3 className="text-2xl sm:text-3xl font-black text-white">85%</h3>
            <p className="text-[10px] text-slate-550 uppercase font-bold tracking-wider mt-1">Para Paseadores</p>
          </div>
        </div>

      </main>

      {/* Footer bar */}
      <footer className="relative z-10 border-t border-slate-900/60 py-6 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 text-center flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <p>© 2026 DogRoute Technologies Inc. Todos los derechos reservados.</p>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-slate-350 transition-colors">
            Políticas de Privacidad & Términos
          </Link>
        </div>
      </footer>
    </div>
  );
}
