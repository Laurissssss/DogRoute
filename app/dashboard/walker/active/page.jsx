"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { 
  Play, 
  Square, 
  MapPin, 
  Clock, 
  Dog, 
  Loader2, 
  AlertCircle, 
  ArrowLeft,
  Navigation,
  CheckCircle2
} from "lucide-react";

export default function ActiveWalk() {
  const router = useRouter();

  // Data states
  const [activeWalk, setActiveWalk] = useState(null);
  const [userId, setUserId] = useState(null);
  
  // Tracking states
  const [status, setStatus] = useState("accepted"); // 'accepted', 'ongoing', 'completed'
  const [lat, setLat] = useState(4.6508); // Bogota base lat
  const [lng, setLng] = useState(-74.0636); // Bogota base lng
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Refs for intervals
  const gpsIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // 1. Fetch current active walk on load
  useEffect(() => {
    const fetchActiveWalk = async () => {
      try {
        setIsLoading(true);
        // Get user session
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push("/login");
          return;
        }
        setUserId(user.id);

        // Fetch walk where walker_id is current user and status is accepted or ongoing
        const { data: walk, error: walkError } = await supabase
          .from("walks")
          .select(`
            *,
            dog:dog_id (
              name,
              breed,
              size,
              temperament,
              photo_url
            )
          `)
          .eq("walker_id", user.id)
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
        }
      } catch (err) {
        console.error("Error fetching active walk:", err);
        setErrorMsg("Error al conectar con la base de datos.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveWalk();

    // Cleanup intervals on unmount
    return () => {
      stopGpsSimulation();
      stopTimer();
    };
  }, [router]);

  // 2. Start/Stop GPS movement simulation
  const startGpsSimulation = (walkId) => {
    if (gpsIntervalRef.current) return;

    gpsIntervalRef.current = setInterval(async () => {
      // Simulate small walking steps
      setLat((prevLat) => {
        const nextLat = prevLat + (Math.random() - 0.5) * 0.0003;
        setLng((prevLng) => {
          const nextLng = prevLng + (Math.random() - 0.5) * 0.0003;

          // Push updated coordinates to Supabase Walks table
          supabase
            .from("walks")
            .update({ latitude: nextLat, longitude: nextLng })
            .eq("id", walkId)
            .then(({ error }) => {
              if (error) console.error("Error updating GPS simulation in DB:", error);
            });

          return nextLng;
        });
        return nextLat;
      });
    }, 10000); // every 10 seconds
  };

  const stopGpsSimulation = () => {
    if (gpsIntervalRef.current) {
      clearInterval(gpsIntervalRef.current);
      gpsIntervalRef.current = null;
    }
  };

  // 3. Start/Stop stopwatch timer
  const startTimer = () => {
    if (timerIntervalRef.current) return;
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  // 4. Trigger simulation automatically if status is ongoing on load
  useEffect(() => {
    if (status === "ongoing" && activeWalk) {
      startGpsSimulation(activeWalk.id);
      startTimer();
    }
  }, [status, activeWalk]);

  // Format seconds to MM:SS
  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Action: Start walking
  const handleStartWalk = async () => {
    if (!activeWalk) return;
    setIsUpdating(true);
    setErrorMsg("");

    try {
      const { error } = await supabase
        .from("walks")
        .update({ status: "ongoing" })
        .eq("id", activeWalk.id);

      if (error) throw error;

      setStatus("ongoing");
      startGpsSimulation(activeWalk.id);
      startTimer();

    } catch (err) {
      console.error("Error starting walk:", err);
      setErrorMsg("No se pudo iniciar el recorrido. Inténtalo de nuevo.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Action: Complete walk
  const handleCompleteWalk = async () => {
    if (!activeWalk) return;
    setIsUpdating(true);
    setErrorMsg("");

    try {
      // Stop intervals
      stopGpsSimulation();
      stopTimer();

      const { error } = await supabase
        .from("walks")
        .update({ status: "completed" })
        .eq("id", activeWalk.id);

      if (error) throw error;

      setStatus("completed");
      setSuccessMsg("¡Paseo completado con éxito! Excelente trabajo.");

      setTimeout(() => {
        router.push("/dashboard/walker");
      }, 3000);

    } catch (err) {
      console.error("Error completing walk:", err);
      setErrorMsg("Ocurrió un error al intentar terminar el paseo.");
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Cargando paseo activo...</p>
      </div>
    );
  }

  if (!activeWalk) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center text-white p-4">
        <AlertCircle className="w-12 h-12 text-slate-500 mb-4 animate-pulse" />
        <h2 className="text-xl font-bold mb-2">No hay paseos activos</h2>
        <p className="text-sm text-slate-400 text-center max-w-sm mb-6">
          No tienes ningún paseo activo asignado en este momento.
        </p>
        <button
          onClick={() => router.push("/dashboard/walker")}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-emerald-500 transition-all font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al Panel
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0b0f19] text-white overflow-hidden font-sans">
      
      {/* SCREEN SPLIT: TOP MAP, BOTTOM PANEL */}
      <div className="flex flex-col h-screen">
        
        {/* SECTION 1: ACTIVE REALTIME MAP */}
        <div className="relative flex-1 bg-[#0d1220] border-b border-slate-800/80 overflow-hidden">
          {/* SVG Map grid */}
          <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#475569" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            {/* Roads */}
            <path d="M 0 150 Q 250 180 900 150" fill="none" stroke="#475569" strokeWidth="4" />
            <path d="M 300 0 Q 330 300 350 600" fill="none" stroke="#475569" strokeWidth="4" />
          </svg>

          {/* Pulse marker representing walker + dog location */}
          <div 
            style={{ 
              top: `${50 + (lat - 4.6508) * 1000}%`, 
              left: `${50 + (lng + -74.0636) * 1000}%` 
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-1000"
          >
            <span className="absolute w-12 h-12 rounded-full bg-emerald-500/20 animate-ping" />
            <div className="w-10 h-10 rounded-full bg-emerald-500 border-2 border-white shadow-xl flex items-center justify-center text-slate-950 relative">
              <Navigation className="w-5 h-5 fill-slate-950 rotate-45 animate-pulse" />
            </div>
            <span className="bg-slate-950 border border-slate-800 text-slate-300 text-[9px] font-bold px-2 py-0.5 rounded-md mt-1.5 shadow whitespace-nowrap">
              Tu Posición (GPS Activo)
            </span>
          </div>

          {/* Compass indicators overlay */}
          <div className="absolute top-4 left-4 p-3 bg-slate-950/80 border border-slate-850 rounded-2xl backdrop-blur-md text-[10px] text-slate-400 space-y-1.5 max-w-xs shadow-md">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              Estado: {status === "ongoing" ? "En Progreso" : "Aceptado"}
            </div>
            <p className="text-slate-500">Coordenadas:</p>
            <div className="font-mono text-xs text-white">
              Lat: {lat.toFixed(6)} | Lng: {lng.toFixed(6)}
            </div>
            {status === "ongoing" && (
              <p className="text-[9px] text-slate-500">Enviando coordenadas en vivo a Supabase cada 10s</p>
            )}
          </div>
        </div>

        {/* SECTION 2: FLOATING CONTROLS PANEL */}
        <div className="relative p-6 bg-[#161c2a] border-t border-slate-800/80 rounded-t-[36px] shadow-[0_-15px_40px_rgba(0,0,0,0.5)] flex flex-col md:flex-row items-center justify-between gap-6 z-10">
          
          {/* Success / Error notification */}
          {successMsg && (
            <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-full max-w-sm flex items-center gap-3 p-4 bg-emerald-500 border border-emerald-400 text-slate-950 rounded-2xl font-bold shadow-xl animate-bounce">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-full max-w-sm flex items-center gap-3 p-4 bg-rose-500 border border-rose-400 text-white rounded-2xl font-bold shadow-xl animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Dog Details Card */}
          <div className="w-full md:w-auto flex items-center gap-4 bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
            <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-400 shrink-0">
              {activeWalk.dog?.photo_url ? (
                <img src={activeWalk.dog.photo_url} alt={activeWalk.dog.name} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <Dog className="w-7 h-7" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                {activeWalk.dog?.name}
                <span className="text-[10px] font-medium text-slate-500">({activeWalk.dog?.breed})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 italic">"Temp: {activeWalk.dog?.temperament}"</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-slate-800 border border-slate-700 text-slate-300">
                  {activeWalk.dog?.size === "large" ? "Grande" : activeWalk.dog?.size === "medium" ? "Mediano" : "Pequeño"}
                </span>
                <span className="text-[10px] text-slate-500">Tarifa: ${parseFloat(activeWalk.price).toLocaleString("es-CO")}</span>
              </div>
            </div>
          </div>

          {/* Stopwatch / Duration details */}
          <div className="flex flex-col items-center md:items-end justify-center text-center md:text-right gap-1 min-w-[120px]">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
              Tiempo Transcurrido
            </span>
            <div className="flex items-center gap-2 text-2xl font-black text-white font-mono tracking-wider">
              <Clock className="w-6 h-6 text-emerald-400 shrink-0" />
              {formatTime(elapsedSeconds)}
            </div>
            <span className="text-[10px] text-slate-500 block">
              Duración contratada: {activeWalk.duration_mins} min
            </span>
          </div>

          {/* Big Action Button */}
          <div className="w-full md:w-auto min-w-[200px]">
            {status === "accepted" ? (
              <button
                onClick={handleStartWalk}
                disabled={isUpdating}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black tracking-wider uppercase text-sm transition-all duration-200 shadow-xl shadow-emerald-500/10 hover:-translate-y-0.5 active:translate-y-0"
              >
                {isUpdating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-slate-950" /> Comenzar Recorrido
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleCompleteWalk}
                disabled={isUpdating}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-slate-950 font-black tracking-wider uppercase text-sm transition-all duration-200 shadow-xl shadow-rose-500/10 hover:-translate-y-0.5 active:translate-y-0"
              >
                {isUpdating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Square className="w-4 h-4 fill-slate-950" /> Terminar Paseo
                  </>
                )}
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
