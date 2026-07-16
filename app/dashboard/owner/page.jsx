"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { 
  Dog, 
  MapPin, 
  Star, 
  Plus, 
  History, 
  Loader2, 
  DollarSign, 
  Clock, 
  X, 
  Check, 
  ChevronRight,
  User,
  Info,
  LogOut
} from "lucide-react";

export default function OwnerDashboard() {
  const router = useRouter();

  // Data states
  const [userProfile, setUserProfile] = useState(null);
  const [dogs, setDogs] = useState([]);
  const [walkers, setWalkers] = useState([]);
  const [activeWalk, setActiveWalk] = useState(null);
  
  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWalkerForRequest, setSelectedWalkerForRequest] = useState(null);
  const [selectedDogForWalk, setSelectedDogForWalk] = useState("");
  const [offeredPrice, setOfferedPrice] = useState("");
  const [duration, setDuration] = useState("60"); // default 60 mins
  const [isSubmittingWalk, setIsSubmittingWalk] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [hoveredWalkerId, setHoveredWalkerId] = useState(null);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/");
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  // Fetch all initial data
  useEffect(() => {
    let clientWalksChannel = null;
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // 1. Get current authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push("/login");
          return;
        }

        // 2. Fetch public profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        setUserProfile(profile || { full_name: "Cliente" });

        // 3. Fetch client's dogs
        const { data: dogsData, error: dogsError } = await supabase
          .from("dogs")
          .select("*")
          .eq("owner_id", user.id);
        
        if (dogsError) throw dogsError;
        setDogs(dogsData || []);
        if (dogsData && dogsData.length > 0) {
          setSelectedDogForWalk(dogsData[0].id); // Auto-select first dog for the request modal
        }

        // 4. Fetch available walkers (must be available and role is walker)
        const { data: walkersData, error: walkersError } = await supabase
          .from("profiles")
          .select("*")
          .eq("role", "walker")
          .eq("is_available", true);
        
        if (walkersError) throw walkersError;
        
        // Filter walkers to only show those that have completed their onboarding (have bio/rate)
        const activeWalkers = (walkersData || []).filter(w => w.bio && w.hourly_rate);
        setWalkers(activeWalkers);

        // 5. Fetch client's current active walk (if any)
        const { data: activeWalksData, error: activeWalksError } = await supabase
          .from("walks")
          .select(`
            *,
            dog:dog_id (name, breed),
            walker:walker_id (full_name)
          `)
          .eq("client_id", user.id)
          .in("status", ["requested", "accepted", "paid", "ongoing"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (activeWalksError) throw activeWalksError;
        setActiveWalk(activeWalksData || null);

        // 6. Suscribirse en tiempo real a cambios en las solicitudes de este cliente
        clientWalksChannel = supabase
          .channel(`client-walks-${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "walks",
              filter: `client_id=eq.${user.id}`,
            },
            async (payload) => {
              console.log("Realtime walk change event on owner dashboard:", payload);
              if (payload.eventType === "INSERT") {
                const newWalk = payload.new;
                if (["requested", "accepted", "paid", "ongoing"].includes(newWalk.status)) {
                  // Fetch relationships
                  const { data: fullWalk, error: walkErr } = await supabase
                    .from("walks")
                    .select(`
                      *,
                      dog:dog_id (name, breed),
                      walker:walker_id (full_name)
                    `)
                    .eq("id", newWalk.id)
                    .single();
                  
                  if (!walkErr && fullWalk) {
                    setActiveWalk(fullWalk);
                  }
                }
              } else if (payload.eventType === "UPDATE") {
                const updatedWalk = payload.new;
                if (["requested", "accepted", "paid", "ongoing"].includes(updatedWalk.status)) {
                  // Fetch relationships
                  const { data: fullWalk, error: walkErr } = await supabase
                    .from("walks")
                    .select(`
                      *,
                      dog:dog_id (name, breed),
                      walker:walker_id (full_name)
                    `)
                    .eq("id", updatedWalk.id)
                    .single();
                  
                  if (!walkErr && fullWalk) {
                    setActiveWalk(fullWalk);
                  }
                } else {
                  // Si pasó a completada o cancelada, remover del panel
                  setActiveWalk(null);
                }
              } else if (payload.eventType === "DELETE") {
                setActiveWalk(null);
              }
            }
          )
          .subscribe();

      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      if (clientWalksChannel) {
        supabase.removeChannel(clientWalksChannel);
      }
    };
  }, [router]);

  const handleCreateWalkRequest = async (e) => {
    e.preventDefault();
    if (!selectedDogForWalk || !offeredPrice || !selectedWalkerForRequest) return;

    setIsSubmittingWalk(true);
    try {
      // Create request in Supabase walks table
      const { error } = await supabase.from("walks").insert({
        client_id: userProfile.id,
        walker_id: selectedWalkerForRequest.id,
        dog_id: selectedDogForWalk,
        price: parseFloat(offeredPrice),
        duration_mins: parseInt(duration),
        status: "requested",
        // Simulate coordinates in Bogota / Colombia for demo
        latitude: 4.6508 + (Math.random() - 0.5) * 0.01,
        longitude: -74.0636 + (Math.random() - 0.5) * 0.01,
      });

      if (error) throw error;

      setRequestSuccess(true);
      setTimeout(() => {
        setSelectedWalkerForRequest(null);
        setRequestSuccess(false);
        setOfferedPrice("");
      }, 2000);

    } catch (err) {
      console.error("Error requesting walk:", err);
      alert("No se pudo crear la solicitud. Intenta de nuevo.");
    } finally {
      setIsSubmittingWalk(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 text-violet-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Cargando tu panel de DogRoute...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0b0f19] text-white overflow-x-hidden font-sans pb-24">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-violet-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-amber-500/5 blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-[#161c2a]/50 border border-slate-800/80 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              {userProfile.avatar_url ? (
                <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-6 h-6" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">¡Hola, {userProfile.full_name}! 👋</h1>
              <p className="text-xs text-slate-400">Dueño de Mascota • Bogotá, Col</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 text-slate-400 hover:text-rose-500 font-semibold text-sm transition-all duration-200 cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Cerrar Sesión
            </button>
            <Link 
              href="/dashboard/owner/onboarding"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-violet-600/20 hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" /> Registrar Mascota
            </Link>
          </div>
        </div>

        {/* ACTIVE WALK BANNER / CARD */}
        {activeWalk && (
          <div className="p-6 bg-gradient-to-br from-[#1c2438] to-[#141b2a] border border-violet-500/30 rounded-2xl backdrop-blur-md space-y-4 animate-fade-in relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse shrink-0 mt-1.5 sm:mt-0" />
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Estado de tu Paseo Activo</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activeWalk.status === "requested" && `Esperando que ${activeWalk.walker?.full_name || "el paseador"} acepte la oferta para pasear a ${activeWalk.dog?.name}...`}
                    {activeWalk.status === "accepted" && `¡${activeWalk.walker?.full_name || "El paseador"} aceptó pasear a ${activeWalk.dog?.name}! Procede al pago seguro.`}
                    {activeWalk.status === "paid" && `Pago confirmado. ${activeWalk.walker?.full_name || "El paseador"} está preparándose para recoger a ${activeWalk.dog?.name}.`}
                    {activeWalk.status === "ongoing" && `¡${activeWalk.dog?.name} está en su paseo en vivo con ${activeWalk.walker?.full_name || "el paseador"}!`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:self-center shrink-0">
                <span className="text-xs text-slate-500">Tarifa propuesta:</span>
                <span className="text-sm font-black text-emerald-400">${parseFloat(activeWalk.price).toLocaleString("es-CO")} COP</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-3 border-t border-slate-800/60">
              <div className="text-xs text-slate-500">
                Mascota: <strong className="text-white">{activeWalk.dog?.name}</strong> • Duración: <strong className="text-white">{activeWalk.duration_mins} min</strong>
              </div>
              <div className="self-end sm:self-center">
                {activeWalk.status === "accepted" && (
                  <Link
                    href="/dashboard/owner/payment"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                  >
                    Proceder al Pago
                  </Link>
                )}
                {activeWalk.status === "paid" && (
                  <Link
                    href="/dashboard/owner/active"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-350 hover:text-white transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Ver Mapa de Espera
                  </Link>
                )}
                {activeWalk.status === "ongoing" && (
                  <Link
                    href="/dashboard/owner/active"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-violet-600/10 cursor-pointer animate-pulse"
                  >
                    Seguir Ruta en Vivo
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SECTION: MY DOGS */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <Dog className="w-5 h-5 text-amber-500" /> Mis perritos ({dogs.length})
          </h2>
          
          {dogs.length === 0 ? (
            <div className="p-8 text-center bg-[#161c2a]/30 border border-dashed border-slate-800 rounded-2xl">
              <Dog className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400 mb-4">Aún no tienes perros registrados.</p>
              <Link 
                href="/dashboard/owner/onboarding"
                className="text-xs font-semibold text-violet-400 hover:text-violet-300 underline underline-offset-4"
              >
                Registra a tu primer perro ahora
              </Link>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x">
              {dogs.map((dog) => (
                <div 
                  key={dog.id}
                  className="flex-shrink-0 w-64 bg-gradient-to-b from-[#1c2438] to-[#141b2a] border border-slate-800/80 rounded-2xl p-4 snap-start relative group hover:border-violet-500/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-400 shrink-0">
                      {dog.photo_url ? (
                        <img src={dog.photo_url} alt={dog.name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <Dog className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-violet-400 transition-colors">{dog.name}</h3>
                      <p className="text-xs text-slate-400 truncate w-36">{dog.breed}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-800/60 pt-3 text-[10px]">
                    <span className="text-slate-500 uppercase tracking-wider">Tamaño</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                      dog.size === "large" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                      dog.size === "medium" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                      "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}>
                      {dog.size === "large" ? "Grande" : dog.size === "medium" ? "Mediano" : "Pequeño"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MAP & WALKERS IN-DRIVER GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT: MAP & INSTRUCTIONS (COL SPAN 2) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* SIMULATED MAP */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-violet-500" /> Mapa de la Zona
              </h2>
              
              {/* Map Canvas Mockup */}
              <div className="relative h-80 w-full bg-[#0d1220] border border-slate-800/80 rounded-3xl overflow-hidden shadow-inner group">
                {/* SVG City Grid roads */}
                <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="cityGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                      <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#475569" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#cityGrid)" />
                  {/* Diagonals / Main roads */}
                  <path d="M 0 100 Q 300 150 800 200" fill="none" stroke="#475569" strokeWidth="3" />
                  <path d="M 200 0 Q 350 200 400 400" fill="none" stroke="#475569" strokeWidth="4" />
                </svg>

                {/* Client Pin (Pulsing center blue dot) */}
                <div className="absolute top-[48%] left-[45%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <span className="absolute w-6 h-6 rounded-full bg-violet-600/40 animate-ping" />
                  <span className="w-3.5 h-3.5 rounded-full bg-violet-500 border-2 border-white shadow-lg relative" />
                  <span className="bg-slate-900/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-md border border-slate-700 mt-1 shadow-md whitespace-nowrap">
                    Tú (Dueño)
                  </span>
                </div>

                {/* Walker Pins on Map */}
                {walkers.map((walker, idx) => {
                  // Use real walker coordinates if they exist, otherwise fall back to static slots
                  const latVal = walker.latitude ? parseFloat(walker.latitude) : 4.6508 + (idx % 2 === 0 ? 0.002 : -0.002);
                  const lngVal = walker.longitude ? parseFloat(walker.longitude) : -74.0636 + (idx % 3 === 0 ? 0.003 : -0.003);
                  
                  // Convert coordinates to map grid percentage
                  const topPercent = Math.max(10, Math.min(90, 50 + (latVal - 4.6508) * 6000));
                  const leftPercent = Math.max(10, Math.min(90, 50 + (lngVal - -74.0636) * 6000));

                  return (
                    <div 
                      key={walker.id}
                      style={{ top: `${topPercent}%`, left: `${leftPercent}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group"
                      onMouseEnter={() => setHoveredWalkerId(walker.id)}
                      onMouseLeave={() => setHoveredWalkerId(null)}
                      onClick={() => {
                        if (dogs.length > 0) {
                          setSelectedWalkerForRequest(walker);
                        } else {
                          alert("Por favor registra un perro primero.");
                        }
                      }}
                    >
                      <span className={`absolute w-8 h-8 rounded-full bg-amber-500/30 animate-pulse ${
                        hoveredWalkerId === walker.id ? "scale-150" : ""
                      }`} />
                      <div className={`p-1.5 rounded-full bg-slate-950 border-2 transition-all duration-200 ${
                        hoveredWalkerId === walker.id ? "border-amber-500 scale-110" : "border-slate-800"
                      }`}>
                        <Dog className="w-3.5 h-3.5 text-amber-500" />
                      </div>
                      <span className="bg-slate-950/90 text-[8px] font-bold px-1.5 py-0.5 rounded border border-slate-800 mt-1 text-slate-300 block shadow whitespace-nowrap">
                        {walker.full_name.split(" ")[0]} • ${walker.hourly_rate}
                      </span>
                    </div>
                  );
                })}

                {/* Overlay details */}
                <div className="absolute bottom-4 left-4 bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl backdrop-blur-md max-w-xs text-[10px] text-slate-400">
                  <p className="font-bold text-white mb-0.5">📡 Buscador InDriver Activo</p>
                  <p>Mascotas listas: {dogs.length}. Paseadores cercanos en línea: {walkers.length}. Haz clic en un pin o en la lista para negociar.</p>
                </div>
              </div>

            </div>

          </div>

          {/* RIGHT: WALKERS AVAILABLE LIST (COL SPAN 1) */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" /> Paseadores en tu Zona
            </h2>

            {walkers.length === 0 ? (
              <div className="p-8 text-center bg-[#161c2a]/30 border border-slate-800 rounded-2xl">
                <Info className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No hay paseadores disponibles de momento.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin">
                {walkers.map((walker) => (
                  <div
                    key={walker.id}
                    onMouseEnter={() => setHoveredWalkerId(walker.id)}
                    onMouseLeave={() => setHoveredWalkerId(null)}
                    className={`p-4 bg-[#161c2a]/50 border rounded-2xl transition-all duration-300 ${
                      hoveredWalkerId === walker.id 
                        ? "border-violet-500/80 shadow-[0_0_15px_rgba(124,58,237,0.15)] bg-[#1e273b]/60 scale-[1.01]" 
                        : "border-slate-800/80"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-sm text-white">{walker.full_name}</h3>
                        
                        {/* Rating Mock */}
                        <div className="flex items-center gap-1 mt-1 text-amber-400 text-xs">
                          <Star className="w-3.5 h-3.5 fill-amber-500" />
                          <span className="font-bold">4.9</span>
                          <span className="text-slate-500 text-[10px]">(18 paseos)</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block uppercase tracking-wider">Tarifa</span>
                        <span className="text-sm font-bold text-emerald-400">${walker.hourly_rate} / hr</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 mt-3 line-clamp-2 italic leading-relaxed">
                      "{walker.bio}"
                    </p>

                    {/* Allowed Dog Sizes */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {walker.allowed_sizes && walker.allowed_sizes.map((size) => (
                        <span 
                          key={size}
                          className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-slate-800 border border-slate-700 text-slate-300"
                        >
                          {size === "small" ? "Pequeño" : size === "medium" ? "Mediano" : "Grande"}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        if (dogs.length === 0) {
                          alert("Debes registrar un perro primero para poder solicitar un paseo.");
                        } else {
                          setSelectedWalkerForRequest(walker);
                        }
                      }}
                      className="w-full mt-4 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all"
                    >
                      Solicitar Paseo <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* FLOATING ACTION BAR: HISTORY LINK */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <Link
          href="/dashboard/owner/history"
          className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-slate-900 border border-slate-700/80 shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:border-violet-500 text-slate-300 hover:text-white transition-all text-xs font-bold tracking-wider uppercase backdrop-blur-md"
        >
          <History className="w-4 h-4 text-violet-500" /> Ver Historial de Paseos
        </Link>
      </div>

      {/* MODAL: SOLICITAR PASEO (IN-DRIVER BIDDING MODAL) */}
      {selectedWalkerForRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-[#161c2a] border border-slate-800 rounded-3xl p-6 shadow-2xl animate-fade-in">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-extrabold text-lg text-white">Negociar Paseo</h3>
              <button 
                onClick={() => setSelectedWalkerForRequest(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {requestSuccess ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 mb-4 animate-pulse">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-white font-bold mb-1">¡Oferta Enviada!</h4>
                <p className="text-xs text-slate-400">
                  Esperando respuesta del paseador {selectedWalkerForRequest.full_name}...
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreateWalkRequest} className="space-y-4">
                
                {/* Info Card Walker */}
                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                    <Dog className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Paseador propuesto</p>
                    <p className="text-sm font-bold text-white">{selectedWalkerForRequest.full_name}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-[10px] text-slate-500">Tarifa Sugerida</p>
                    <p className="text-xs font-bold text-emerald-400">${selectedWalkerForRequest.hourly_rate}/hr</p>
                  </div>
                </div>

                {/* Form: Select Dog */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                    ¿A quién paseamos?
                  </label>
                  <select
                    value={selectedDogForWalk}
                    onChange={(e) => setSelectedDogForWalk(e.target.value)}
                    className="w-full px-3.5 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
                  >
                    {dogs.map((dog) => (
                      <option key={dog.id} value={dog.id} className="bg-slate-900">
                        {dog.name} ({dog.breed})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Form: Duration */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                    Duración del Paseo
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "30", label: "30 min" },
                      { value: "60", label: "1 hora" },
                      { value: "120", label: "2 horas" }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setDuration(opt.value)}
                        className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                          duration === opt.value
                            ? "bg-violet-600/10 border-violet-500 text-white"
                            : "bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-900"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form: Price Offer (The InDriver logic) */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                    Propón tu tarifa (InDriver)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <DollarSign className="w-4 h-4 text-violet-500" />
                    </div>
                    <input
                      type="number"
                      required
                      min="1"
                      step="0.01"
                      placeholder={`Ej. ${selectedWalkerForRequest.hourly_rate}`}
                      value={offeredPrice}
                      onChange={(e) => setOfferedPrice(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Propón un precio de salida. El paseador podrá aceptar tu oferta, hacer una contraoferta o rechazarla.
                  </p>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmittingWalk}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold transition-all duration-200 shadow-lg disabled:opacity-50 text-sm pt-4"
                >
                  {isSubmittingWalk ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Enviando Oferta...
                    </>
                  ) : (
                    <>
                      Enviar Oferta de Paseo
                    </>
                  )}
                </button>

              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
