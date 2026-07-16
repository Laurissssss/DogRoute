"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { 
  CreditCard, 
  DollarSign, 
  Smartphone, 
  Globe, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight,
  ArrowLeft,
  User,
  Building
} from "lucide-react";

export default function OwnerPayment() {
  const router = useRouter();

  // Data states
  const [activeWalk, setActiveWalk] = useState(null);
  const [userId, setUserId] = useState(null);
  
  // Form/Tab states
  const [activeTab, setActiveTab] = useState("nequi"); // 'nequi' or 'pse'
  const [nequiPhone, setNequiPhone] = useState("");
  const [psePersonType, setPsePersonType] = useState("natural"); // 'natural' or 'juridica'
  const [pseBank, setPseBank] = useState("");
  const [pseEmail, setPseEmail] = useState("");

  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Colombian Banks List for PSE
  const colombianBanks = [
    "Bancolombia",
    "Nequi",
    "Daviplata",
    "Davivienda",
    "Banco de Bogotá",
    "BBVA Colombia",
    "Banco de Occidente",
    "Banco Popular",
    "Banco AV Villas",
    "Scotiabank Colpatria",
    "Itaú Colombia"
  ];

  // 1. Fetch walk waiting for payment (status = 'accepted')
  useEffect(() => {
    const fetchWalkForPayment = async () => {
      try {
        setIsLoading(true);
        // Get user session
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push("/login");
          return;
        }
        setUserId(user.id);

        // Fetch last walk with status 'accepted' for this client
        const { data: walk, error: walkError } = await supabase
          .from("walks")
          .select(`
            *,
            dog:dog_id (
              name,
              breed,
              size
            ),
            walker:walker_id (
              full_name
            )
          `)
          .eq("client_id", user.id)
          .eq("status", "accepted")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (walkError) throw walkError;

        if (walk) {
          setActiveWalk(walk);
        }
      } catch (err) {
        console.error("Error loading payment info:", err);
        setErrorMsg("Error al obtener la información de cobro.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWalkForPayment();
  }, [router]);

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!activeWalk) return;

    // Validate inputs
    if (activeTab === "nequi" && nequiPhone.length !== 10) {
      setErrorMsg("Por favor, ingresa un número de celular de Nequi válido (10 dígitos).");
      return;
    }
    if (activeTab === "pse" && (!pseBank || !pseEmail)) {
      setErrorMsg("Por favor, completa todos los campos para el pago por PSE.");
      return;
    }

    setIsProcessing(true);
    setErrorMsg("");

    // Simulate Payment Gateway Stages
    try {
      setProcessingStep("Estableciendo conexión segura...");
      await new Promise(r => setTimeout(r, 1000));
      
      setProcessingStep(
        activeTab === "nequi" 
          ? "Enviando notificación push a Nequi..." 
          : "Redirigiendo a la pasarela de tu banco..."
      );
      await new Promise(r => setTimeout(r, 1000));
      
      setProcessingStep("Procesando pago y liquidando comisiones...");
      await new Promise(r => setTimeout(r, 1000));

      // 2. Update walk status to 'paid' in Supabase walks table
      // IMPORTANT: Ensure you have run the ALTER TABLE sql migration to add 'paid' status
      const { error } = await supabase
        .from("walks")
        .update({ status: "paid" })
        .eq("id", activeWalk.id);

      if (error) {
        if (error.code === "23514") {
          throw new Error("Error de restricción de base de datos. Asegúrate de ejecutar el script ALTER TABLE en tu SQL Editor para admitir el estado 'paid'.");
        }
        throw error;
      }

      setSuccessMsg("¡Pago aprobado con éxito! Liquidación completada.");
      
      // 3. Redirect to active tracking page
      setTimeout(() => {
        router.push("/dashboard/owner/active");
      }, 1500);

    } catch (err) {
      console.error("Payment error:", err);
      setErrorMsg(err.message || "Ocurrió un error al procesar el pago simulado.");
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Cargando pasarela de pago...</p>
      </div>
    );
  }

  if (!activeWalk) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center text-white p-4">
        <AlertCircle className="w-12 h-12 text-slate-500 mb-4 animate-pulse" />
        <h2 className="text-xl font-bold mb-2">No hay cobros pendientes</h2>
        <p className="text-sm text-slate-400 text-center max-w-sm mb-6">
          No encontramos ningún paseo aceptado por un paseador que esté en espera de pago.
        </p>
        <button
          onClick={() => router.push("/dashboard/owner")}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-violet-500 transition-all font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al Dashboard
        </button>
      </div>
    );
  }

  // Price breakdown calculations
  const totalPrice = parseFloat(activeWalk.price);
  const commission = totalPrice * 0.15;
  const walkerShare = totalPrice * 0.85;

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#0b0f19] px-4 py-12 overflow-hidden font-sans select-none">
      {/* Aurora Ambient Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-emerald-600/15 to-indigo-650/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-violet-500/10 to-rose-500/15 blur-[120px] pointer-events-none" />

      {/* Checkout Container */}
      <div className="relative w-full max-w-2xl bg-[#161c2a]/70 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-all duration-300 grid grid-cols-1 md:grid-cols-5 gap-8">
        
        {/* LEFT COLUMN: PURCHASE SUMMARY (COL SPAN 2) */}
        <div className="md:col-span-2 space-y-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800/80 pb-6 md:pb-0 md:pr-6">
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Paseo Seguro
              </span>
              <h2 className="text-xl font-black text-white mt-3">Resumen de Compra</h2>
            </div>

            {/* Breakdown Card */}
            <div className="space-y-4 text-sm bg-slate-900/60 p-4 rounded-2xl border border-slate-800/60">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Paseo de:</span>
                <span className="text-white font-bold">{activeWalk.dog?.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Paseador:</span>
                <span className="text-white font-bold">{activeWalk.walker?.full_name}</span>
              </div>
              
              <hr className="border-slate-800" />
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Paseador (85%):</span>
                <span className="text-slate-300">${walkerShare.toLocaleString("es-CO", { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Servicio plataforma (15%):</span>
                <span className="text-slate-300">${commission.toLocaleString("es-CO", { maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">Total a pagar</span>
              <span className="text-2xl font-black text-white flex items-baseline">
                ${totalPrice.toLocaleString("es-CO")}
                <span className="text-xs font-normal text-emerald-400 ml-1">COP</span>
              </span>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-slate-900/40 border border-slate-850 rounded-xl text-[10px] text-slate-500">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>Garantía de paseo seguro DogRoute. Tu dinero se libera al completar el servicio.</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LOCALIZED PAYMENT GATEWAY (COL SPAN 3) */}
        <div className="md:col-span-3 space-y-6">
          
          {/* Form Header */}
          <div>
            <h3 className="font-extrabold text-sm text-slate-300 uppercase tracking-wider">Método de Pago</h3>
            <p className="text-xs text-slate-500 mt-1">Soporte exclusivo para banca digital colombiana</p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Tabs header */}
          <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => { setActiveTab("nequi"); setErrorMsg(""); }}
              className={`py-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "nequi" 
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Smartphone className="w-4 h-4" /> Nequi
            </button>
            <button
              onClick={() => { setActiveTab("pse"); setErrorMsg(""); }}
              className={`py-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "pse" 
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Globe className="w-4 h-4" /> PSE
            </button>
          </div>

          {/* Form Submission */}
          <form onSubmit={handleProcessPayment} className="space-y-4">
            
            {activeTab === "nequi" ? (
              /* NEQUI FORM FIELDS */
              <div className="space-y-2 animate-fade-in">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Celular de tu cuenta Nequi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Smartphone className="w-5 h-5 text-emerald-500" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength="10"
                    placeholder="Ej. 3123456789"
                    value={nequiPhone}
                    onChange={(e) => setNequiPhone(e.target.value.replace(/\D/g, ""))}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  Te enviaremos una notificación push a tu celular para aprobar la transacción.
                </p>
              </div>
            ) : (
              /* PSE FORM FIELDS */
              <div className="space-y-4 animate-fade-in">
                
                {/* Person Type Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Tipo de Persona
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPsePersonType("natural")}
                      className={`py-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        psePersonType === "natural" 
                          ? "bg-slate-800 border-slate-700 text-white" 
                          : "bg-slate-900/30 border-slate-800 text-slate-500 hover:text-slate-400"
                      }`}
                    >
                      <User className="w-3.5 h-3.5" /> Persona Natural
                    </button>
                    <button
                      type="button"
                      onClick={() => setPsePersonType("juridica")}
                      className={`py-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        psePersonType === "juridica" 
                          ? "bg-slate-800 border-slate-700 text-white" 
                          : "bg-slate-900/30 border-slate-800 text-slate-500 hover:text-slate-400"
                      }`}
                    >
                      <Building className="w-3.5 h-3.5" /> Persona Jurídica
                    </button>
                  </div>
                </div>

                {/* Bank Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Banco de Origen
                  </label>
                  <select
                    required
                    value={pseBank}
                    onChange={(e) => setPseBank(e.target.value)}
                    className="w-full px-3.5 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
                  >
                    <option value="" className="bg-slate-900 text-slate-500">Selecciona tu banco</option>
                    {colombianBanks.map(bank => (
                      <option key={bank} value={bank} className="bg-slate-900">{bank}</option>
                    ))}
                  </select>
                </div>

                {/* PSE Email */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Correo registrado en PSE
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="tucorreo@ejemplo.com"
                    value={pseEmail}
                    onChange={(e) => setPseEmail(e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-650 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>
            )}

            {/* Confirm Payment button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full mt-6 flex items-center justify-center gap-2 py-4 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black tracking-wider uppercase text-xs transition-all duration-200 shadow-lg shadow-emerald-500/10 disabled:opacity-50"
            >
              Confirmar Pago <ArrowRight className="w-4 h-4" />
            </button>

          </form>

        </div>
      </div>

      {/* OVERLAY: PROCESSING MODAL (3-SECOND SIMULATION) */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-sm bg-[#161c2a] border border-slate-800 rounded-3xl p-8 text-center shadow-2xl space-y-6">
            
            {successMsg ? (
              /* Success Stage */
              <div className="space-y-4 animate-fade-in">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 mx-auto animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-white">{successMsg}</h4>
                <p className="text-xs text-slate-400">Redirigiendo al mapa en vivo para seguir tu ruta...</p>
              </div>
            ) : (
              /* Loading Stage */
              <div className="space-y-4">
                <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto" />
                <h4 className="text-lg font-bold text-white">Procesando Transacción</h4>
                <p className="text-xs text-slate-400 animate-pulse">{processingStep}</p>
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-1.5 rounded-full animate-progress" />
                </div>
                <p className="text-[10px] text-slate-500">Por favor, no cierres esta ventana ni recargues la página.</p>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
