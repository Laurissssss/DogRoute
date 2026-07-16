"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { 
  Dog, 
  MapPin, 
  Star, 
  Phone, 
  Loader2, 
  AlertCircle, 
  Check, 
  ArrowLeft,
  Navigation,
  Sparkles
} from "lucide-react";

export default function ActiveWalkClient() {
  const router = useRouter();

  // Data states
  const [activeWalk, setActiveWalk] = useState(null);
  const [userId, setUserId] = useState(null);
  
  // Tracking states
  const [status, setStatus] = useState("accepted"); // 'accepted', 'ongoing', 'completed'
  const [lat, setLat] = useState(4.6508);
  const [lng, setLng] = useState(-74.0636);

  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [showFinishedModal, setShowFinishedModal] = useState(false);

  // 1. Fetch current active walk on load
  useEffect(() => {
    let walkChannel = null;

    const fetchActiveWalkAndSubscribe = async () => {
      try {
        setIsLoading(true);
        // Get user session
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push("/login");
          return;
        }
        setUserId(user.id);

        // Fetch walk where client_id is current user and status is accepted or ongoing
        const { data: walk, error: walkError } = await supabase
          .from("walks")
          .select(`
            *,
            dog:dog_id (
              name,
              breed,
              size,
              photo_url
            ),
            walker:walker_id (
              full_name,
              avatar_url,
              bio
            )
          `)
          .eq("client_id", user.id)
          .in("status", ["accepted", "ongoing"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (walkError) throw walkError;

        if (walk) {
          setActiveWalk(walk);
          setStatus(walk.status);
          if (walk.latitude && walk.longitude) {
            setLat(parseFloat(walk.latitude));
            setLng(parseFloat(walk.longitude));
          }

          // 2. CONECTAR SUPABASE REALTIME CHANNEL
          // Suscribirse a cambios en la fila específica de este paseo
          walkChannel = supabase
            .channel(`client-walk-tracking-${walk.id}`)
            .on(
              "postgres_changes",
              {
                event: "UPDATE",
                schema: "public",
                table: "walks",
                filter: `id=eq.${walk.id}`,
              },
              (payload) => {
                console.log("Realtime coordinate update received:", payload.new);
                const updatedWalk = payload.new;
                
                // Actualizar estado local del paseo
                setStatus(updatedWalk.status);
                
                // Si cambian las coordenadas, actualizar pines del mapa
                if (updatedWalk.latitude && updatedWalk.longitude) {
                  setLat(parseFloat(updatedWalk.latitude));
                  setLng(parseFloat(updatedWalk.longitude));
                }

                // Si cambia el estado a 'completed', disparar modal festivo
                if (updatedWalk.status === "completed") {
                  setShowFinishedModal(true);
                }
              }
            )
            .subscribe();
        }
      } catch (err) {
        console.error("Error setting up realtime tracking:", err);
        setErrorMsg("Error al conectar el rastreador en tiempo real.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveWalkAndSubscribe();

    // Limpieza de canal al desmontar componente
    return () => {
      if (walkChannel) {
        supabase.removeChannel(walkChannel);
      }
    };
  }, [router]);

  // Status helper text
  const getStatusMessage = () => {
    const dogName = activeWalk?.dog?.name || "Tu perro";
    if (status === "accepted") {
      return `El paseador está en camino a recoger a ${dogName} 🚶‍♂️`;
    }
    if (status === "ongoing") {
      return `¡${dogName} está disfrutando de su paseo en tiempo real! 🐾`;
    }
    return `Paseo de ${dogName} completado.`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 text-violet-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Cargando monitor de paseo activo...</p>
      </div>
    );
  }

  if (!activeWalk) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center text-white p-4">
        <AlertCircle className="w-12 h-12 text-slate-500 mb-4 animate-pulse" />
        <h2 className="text-xl font-bold mb-2">No hay paseos activos</h2>
        <p className="text-sm text-slate-400 text-center max-w-sm mb-6">
          Tu mascota no tiene ningún paseo en curso en este momento.
        </p>
        <button
          onClick={() => router.push("/dashboard/owner")}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-violet-500 transition-all font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al Buscador
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0b0f19] text-white overflow-hidden font-sans">
      
      {/* SCREEN SPLIT: TOP REALTIME MAP, BOTTOM CONTROL/INFO PANEL */}
      <div className="flex flex-col h-screen">
        
        {/* SECTION 1: MAP VIEW */}
        <div className="relative flex-1 bg-[#0d1220] border-b border-slate-800/80 overflow-hidden">
          {/* SVG Map Grid Layout */}
          <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="gridPattern" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#475569" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#gridPattern)" />
            {/* City main roads */}
            <path d="M 0 150 Q 250 180 900 150" fill="none" stroke="#475569" strokeWidth="4" />
            <path d="M 300 0 Q 330 300 350 600" fill="none" stroke="#475569" strokeWidth="4" />
          </svg>

          {/* Realtime Dog/Walker Pulse Pin */}
          {/* Using CSS transitions for extremely smooth pin movement across the map */}
          <div 
            style={{ 
              top: `${50 + (lat - 4.6508) * 1000}%`, 
              left: `${50 + (lng + -74.0636) * 1000}%` 
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-1000 ease-in-out"
          >
            <span className="absolute w-12 h-12 rounded-full bg-violet-500/20 animate-ping" />
            <div className="w-11 h-11 rounded-full bg-violet-600 border-2 border-white shadow-xl flex items-center justify-center text-white relative">
              <Dog className="w-6 h-6 animate-pulse" />
            </div>
            <span className="bg-slate-950 border border-slate-800 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-md mt-1.5 shadow-md whitespace-nowrap uppercase tracking-wider">
              {activeWalk.dog?.name} (En vivo)
            </span>
          </div>

          {/* Connection Status indicator overlay */}
          <div className="absolute top-4 left-4 p-3 bg-slate-950/80 border border-slate-850 rounded-2xl backdrop-blur-md text-[10px] text-slate-400 space-y-1 shadow-md">
            <div className="flex items-center gap-1.5 text-violet-400 font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
              Rastreador Supabase Activo
            </div>
            <p className="text-[9px] text-slate-500">Transmisión de coordenadas en vivo habilitada</p>
          </div>
        </div>

        {/* SECTION 2: FLOATING PANEL DETAILS */}
        <div className="relative p-6 bg-[#161c2a] border-t border-slate-800/80 rounded-t-[36px] shadow-[0_-15px_40px_rgba(0,0,0,0.5)] flex flex-col md:flex-row items-center justify-between gap-6 z-10">
          
          {/* Main Status Message Banner */}
          <div className="w-full md:w-auto flex items-center gap-4 bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex-1">
            <div className="w-12 h-12 bg-violet-500/10 border border-violet-500/30 rounded-xl flex items-center justify-center text-violet-400 shrink-0">
              <Navigation className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Monitoreo del Viaje</p>
              <h3 className="text-sm font-bold text-white mt-0.5">
                {getStatusMessage()}
              </h3>
            </div>
          </div>

          {/* Walker Profile Details */}
          <div className="w-full md:w-auto flex items-center gap-4 bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl">
            <div className="w-12 h-12 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 shrink-0 object-cover">
              {activeWalk.walker?.avatar_url ? (
                <img src={activeWalk.walker.avatar_url} alt="Walker Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Paseador:</span>
                <span className="text-xs font-bold text-white">{activeWalk.walker?.full_name}</span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-amber-400 text-xs">
                <Star className="w-3.5 h-3.5 fill-amber-500" />
                <span className="font-bold">4.9</span>
                <span className="text-slate-500 text-[10px]">(18 paseos)</span>
              </div>
            </div>

            {/* Dummy Call/Contact button */}
            <button
              onClick={() => alert("Llamando al paseador (Simulado)...")}
              className="p-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-all shadow-md shrink-0"
            >
              <Phone className="w-4 h-4 fill-white" />
            </button>
          </div>

        </div>

      </div>

      {/* CELEBRATION MODAL: WALK COMPLETED */}
      {showFinishedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="relative w-full max-w-sm bg-[#161c2a] border border-slate-800 rounded-3xl p-8 text-center shadow-2xl animate-fade-in">
            
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)] animate-bounce">
              <Sparkles className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-black text-white mb-2">
              ¡Tu perrito ha vuelto! 🎉
            </h3>
            
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              El paseo de **{activeWalk.dog?.name}** ha finalizado con éxito. Esperamos que se haya divertido. ¿Te gustaría dejarle una calificación al paseador?
            </p>

            <button
              onClick={() => {
                setShowFinishedModal(false);
                router.push("/dashboard/owner/history");
              }}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm transition-all duration-200 shadow-xl shadow-violet-600/25"
            >
              Calificar el Paseo <Check className="w-4 h-4" />
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
