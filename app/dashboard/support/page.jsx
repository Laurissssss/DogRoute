"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  HelpCircle, 
  MessageSquare, 
  Send, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import Link from "next/link";

export default function SupportPage() {
  const router = useRouter();

  // Form states
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  
  // UI states
  const [isSending, setIsSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSendTicket = (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setErrorMsg("Por favor, completa todos los campos del formulario.");
      return;
    }

    setIsSending(true);
    setErrorMsg("");
    setSuccessMsg("");

    // Simulate sending ticket to support email / backend DB
    setTimeout(() => {
      setIsSending(false);
      setSuccessMsg("¡Ticket enviado con éxito! Nos contactaremos contigo en menos de 24 horas.");
      setSubject("");
      setMessage("");

      setTimeout(() => {
        setSuccessMsg("");
      }, 4000);
    }, 2000);
  };

  return (
    <div className="relative min-h-screen bg-[#0b0f19] text-white font-sans pb-24 select-none">
      {/* Background Decor Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-violet-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-amber-500/5 blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        
        {/* Header navigation bar */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-3 bg-[#161c2a]/50 hover:bg-[#1e273b] border border-slate-800 rounded-xl transition-all text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-violet-550" /> Soporte y Ayuda
            </h1>
            <p className="text-xs text-slate-400 mt-1">¿Tienes problemas o dudas técnicas? Cuéntanos tu caso</p>
          </div>
        </div>

        {/* Support ticket card form */}
        <div className="bg-[#161c2a]/60 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md shadow-lg">
          <form onSubmit={handleSendTicket} className="space-y-6">
            
            {/* Success notification */}
            {successMsg && (
              <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm animate-fade-in">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Error notification */}
            {errorMsg && (
              <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm animate-shake">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Subject */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-350 uppercase tracking-wider block">
                Asunto del Mensaje
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Problemas con el cobro o la geolocalización"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-550 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm animate-fade-in"
              />
            </div>

            {/* Message Details */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-350 uppercase tracking-wider block">
                Detalle de tu solicitud
              </label>
              <div className="relative">
                <div className="absolute top-3.5 left-3.5 text-slate-500 pointer-events-none">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <textarea
                  required
                  placeholder="Explícanos a detalle tu solicitud para darte soporte lo antes posible..."
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-550 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm resize-none"
                />
              </div>
            </div>

            {/* Send ticket button */}
            <button
              type="submit"
              disabled={isSending}
              className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black tracking-wider uppercase text-xs transition-all shadow-md disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Enviar Mensaje de Soporte
                </>
              )}
            </button>

          </form>
        </div>

      </div>
    </div>
  );
}
