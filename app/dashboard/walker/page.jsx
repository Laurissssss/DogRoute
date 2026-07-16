"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { 
  User, 
  Star, 
  TrendingUp, 
  Compass, 
  MapPin, 
  DollarSign, 
  Clock, 
  Check, 
  X, 
  Loader2, 
  AlertCircle, 
  BellRing,
  Dog,
  LogOut,
  Settings
} from "lucide-react";

export default function WalkerDashboard() {
  const router = useRouter();

  // Data states
  const [walkerProfile, setWalkerProfile] = useState(null);
  const [offers, setOffers] = useState([]);
  const [earnings, setEarnings] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  
  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false); // Availability toggle
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/");
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  const handleToggleAvailability = async () => {
    const nextState = !isAvailable;
    setIsAvailable(nextState);
    
    let latitude = walkerProfile?.latitude || 4.6508;
    let longitude = walkerProfile?.longitude || -74.0636;

    const updateDB = async (val, latVal, lngVal) => {
      try {
        const { error } = await supabase
          .from("profiles")
          .update({
            is_available: val,
            latitude: val ? latVal : null,
            longitude: val ? lngVal : null
          })
          .eq("id", walkerProfile.id);
        
        if (error) throw error;
      } catch (err) {
        console.error("Error updating availability in DB:", err);
        setIsAvailable(!val); // Revert state
      }
    };

    if (nextState && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateDB(nextState, position.coords.latitude, position.coords.longitude);
        },
        (err) => {
          console.warn("Geolocation failed, using default coords:", err);
          updateDB(nextState, latitude, longitude);
        }
      );
    } else {
      updateDB(nextState, latitude, longitude);
    }
  };

  // Fetch all initial data
  useEffect(() => {
    let offersChannel = null;
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
        
        setWalkerProfile(profile);
        if (profile) {
          setIsAvailable(profile.is_available ?? false);
        }

        // 3. Fetch walker's statistics (Completed walks & earnings)
        const { data: statsData } = await supabase
          .from("walks")
          .select("price, walker_earnings")
          .eq("walker_id", user.id)
          .eq("status", "completed");
        
        if (statsData) {
          const totalEarnings = statsData.reduce((acc, curr) => acc + parseFloat(curr.walker_earnings || 0), 0);
          setEarnings(totalEarnings);
          setCompletedCount(statsData.length);
        }

        // 4. Fetch incoming walk offers (status = 'requested' and targeted to this walker)
        const { data: offersData, error: offersError } = await supabase
          .from("walks")
          .select(`
            id,
            price,
            duration_mins,
            client_id,
            latitude,
            longitude,
            created_at,
            dog:dog_id (
              name,
              breed,
              size,
              photo_url
            ),
            client:client_id (
              full_name,
              avatar_url
            )
          `)
          .eq("status", "requested")
          .eq("walker_id", user.id);
        
        if (offersError) throw offersError;
        setOffers(offersData || []);

        // 5. Suscribirse en tiempo real a las ofertas para este walker
        offersChannel = supabase
          .channel(`walker-offers-${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "walks",
              filter: `walker_id=eq.${user.id}`,
            },
            async (payload) => {
              console.log("Realtime walk change event:", payload);
              if (payload.eventType === "INSERT") {
                // Fetch dog and client details for the new walk
                const { data: newWalk, error } = await supabase
                  .from("walks")
                  .select(`
                    id,
                    price,
                    duration_mins,
                    client_id,
                    latitude,
                    longitude,
                    created_at,
                    dog:dog_id (
                      name,
                      breed,
                      size,
                      photo_url
                    ),
                    client:client_id (
                      full_name,
                      avatar_url
                    )
                  `)
                  .eq("id", payload.new.id)
                  .single();

                if (!error && newWalk && newWalk.status === "requested") {
                  setOffers((prev) => {
                    if (prev.some(o => o.id === newWalk.id)) return prev;
                    return [newWalk, ...prev];
                  });
                }
              } else if (payload.eventType === "UPDATE") {
                const updatedWalk = payload.new;
                if (updatedWalk.status !== "requested") {
                  // Si ya no está en estado requested (ej: aceptado, pagado, cancelado), quitar de la lista
                  setOffers((prev) => prev.filter(o => o.id !== updatedWalk.id));
                } else {
                  // Si se actualiza el precio u otro campo y sigue solicitado
                  setOffers((prev) =>
                    prev.map((o) =>
                      o.id === updatedWalk.id
                        ? { ...o, price: updatedWalk.price, duration_mins: updatedWalk.duration_mins }
                        : o
                    )
                  );
                }
              } else if (payload.eventType === "DELETE") {
                setOffers((prev) => prev.filter((o) => o.id !== payload.old.id));
              }
            }
          )
          .subscribe();

      } catch (err) {
        console.error("Error loading walker dashboard:", err);
        setErrorMsg("Error al conectar con la base de datos.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      if (offersChannel) {
        supabase.removeChannel(offersChannel);
      }
    };
  }, [router]);

  // Handle accepting a walk
  const handleAcceptWalk = async (walkId) => {
    if (!walkerProfile) return;
    setActionLoadingId(walkId);
    setErrorMsg("");

    try {
      // Update walk status to accepted and link walker_id
      const { error } = await supabase
        .from("walks")
        .update({
          status: "accepted",
          walker_id: walkerProfile.id,
        })
        .eq("id", walkId);

      if (error) throw error;

      // Redirect immediately to the active walk view
      router.push("/dashboard/walker/active");

    } catch (err) {
      console.error("Error accepting walk request:", err);
      setErrorMsg("No se pudo aceptar el paseo. Tal vez fue tomado por otro paseador.");
      setActionLoadingId(null);
    }
  };

  // Handle rejecting a walk (remove locally from list for current session view)
  const handleRejectWalk = (walkId) => {
    setOffers(offers.filter(offer => offer.id !== walkId));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Cargando panel de paseador...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0b0f19] text-white overflow-x-hidden font-sans pb-24">
      {/* Settings Floating Button */}
      <div className="absolute top-6 right-6 z-40">
        <Link
          href="/dashboard/walker/profile"
          className="flex items-center justify-center w-11 h-11 rounded-full bg-slate-900 border border-slate-800 hover:border-violet-500/50 text-slate-400 hover:text-violet-400 hover:rotate-45 transition-all duration-300 shadow-lg shadow-black/20 cursor-pointer"
          title="Editar Perfil"
        >
          <Settings className="w-5 h-5" />
        </Link>
      </div>

      {/* Aurora Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-emerald-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-violet-500/5 blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* BANNER SECTION: PROFILE & AVAILABILITY */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 bg-[#161c2a]/50 border border-slate-800/80 rounded-3xl backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 relative">
              {walkerProfile?.avatar_url ? (
                <img src={walkerProfile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-7 h-7" />
              )}
              {isAvailable && (
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#161c2a] animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-white">{walkerProfile?.full_name}</h1>
                <div className="flex items-center text-amber-400 text-xs font-bold gap-0.5 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  <Star className="w-3 h-3 fill-amber-500" /> 4.9
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1">Paseador Profesional • Bogotá, Col</p>
            </div>
          </div>

          {/* Availability Toggle Switch & Logout */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 text-slate-400 hover:text-rose-500 font-semibold text-xs transition-all duration-200 cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Cerrar Sesión
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                Estado:
              </span>
              <button
                onClick={handleToggleAvailability}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all duration-300 cursor-pointer ${
                  isAvailable 
                    ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-450 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isAvailable ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                {isAvailable ? "DISPONIBLE" : "OCUPADO"}
              </button>
            </div>
          </div>
        </div>

        {/* METRICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* WEEKLY EARNINGS CARD */}
          <div className="p-6 bg-gradient-to-br from-[#1c2438] to-[#141b2a] border border-slate-800/80 rounded-2xl flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                Ganancias Acumuladas (85%)
              </span>
              <h3 className="text-3xl font-extrabold text-white flex items-baseline gap-1">
                ${earnings.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                <span className="text-xs font-normal text-emerald-400">COP</span>
              </h3>
              <p className="text-[10px] text-slate-500">Comisión del 15% descontada automáticamente</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-7 h-7" />
            </div>
          </div>

          {/* COMPLETED WALKS CARD */}
          <div className="p-6 bg-gradient-to-br from-[#1c2438] to-[#141b2a] border border-slate-800/80 rounded-2xl flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                Paseos Realizados
              </span>
              <h3 className="text-3xl font-extrabold text-white">
                {completedCount} <span className="text-sm font-normal text-slate-400">viajes</span>
              </h3>
              <p className="text-[10px] text-slate-500">Tu calificación se mantiene en 4.9 estrellas</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Compass className="w-7 h-7" />
            </div>
          </div>

        </div>

        {/* OFFERS PANEL (IN-DRIVER STYLE) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <BellRing className="w-5 h-5 text-emerald-400 animate-bounce" /> 
              Ofertas en tu Zona
              {isAvailable && offers.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-extrabold text-[10px] animate-pulse">
                  {offers.length} NUEVAS
                </span>
              )}
            </h2>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!isAvailable ? (
            /* OFF-DUTY STATE */
            <div className="p-12 text-center bg-[#161c2a]/30 border border-slate-800 rounded-3xl">
              <Compass className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-300">Estás fuera de servicio</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Cambia tu estado a "Disponible" arriba para comenzar a recibir solicitudes en tiempo real.
              </p>
            </div>
          ) : offers.length === 0 ? (
            /* EMPTY OFFERS STATE */
            <div className="p-12 text-center bg-[#161c2a]/30 border border-slate-800 rounded-3xl">
              <Loader2 className="w-8 h-8 text-slate-700 animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-300">Buscando solicitudes cercanas...</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Las ofertas de paseos en tu área aparecerán aquí automáticamente en tiempo real.
              </p>
            </div>
          ) : (
            /* OFFERS GRID */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offers.map((offer) => {
                // Generate a random simulated distance for visual premium effect
                const distanceSimulated = (0.3 + Math.random() * 1.5).toFixed(1);

                return (
                  <div 
                    key={offer.id}
                    className="bg-[#161c2a]/60 border border-slate-800/80 rounded-2xl p-5 hover:border-emerald-500/50 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Dog profile details */}
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-400 shrink-0">
                          {offer.dog?.photo_url ? (
                            <img src={offer.dog.photo_url} alt={offer.dog.name} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <Dog className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-bold text-white">{offer.dog?.name || "Mascota"}</h3>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                              offer.dog?.size === "large" ? "bg-red-500/10 text-red-400" :
                              offer.dog?.size === "medium" ? "bg-amber-500/10 text-amber-400" :
                              "bg-emerald-500/10 text-emerald-400"
                            }`}>
                              {offer.dog?.size === "large" ? "G" : offer.dog?.size === "medium" ? "M" : "P"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">{offer.dog?.breed || "Raza común"}</p>
                        </div>
                      </div>

                      {/* Client info & details */}
                      <div className="mt-4 space-y-2 border-t border-slate-800/60 pt-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">Dueño:</span>
                          <span className="text-slate-300 font-medium">{offer.client?.full_name}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-500" /> Duración:
                          </span>
                          <span className="text-slate-300 font-medium">{offer.duration_mins} minutos</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" /> Distancia:
                          </span>
                          <span className="text-slate-300 font-medium">{distanceSimulated} km de ti</span>
                        </div>
                      </div>
                    </div>

                    {/* Pricing and Action Buttons */}
                    <div className="mt-5 space-y-3">
                      
                      {/* Price Offered (glowing emerald badge) */}
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                          Tarifa Ofrecida:
                        </span>
                        <span className="text-base font-black text-white flex items-center">
                          <DollarSign className="w-4 h-4 text-emerald-400" />
                          {parseFloat(offer.price).toLocaleString("es-CO")}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Reject */}
                        <button
                          onClick={() => handleRejectWalk(offer.id)}
                          className="py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all flex items-center justify-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Rechazar
                        </button>
                        
                        {/* Accept */}
                        <button
                          onClick={() => handleAcceptWalk(offer.id)}
                          disabled={actionLoadingId !== null}
                          className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-extrabold transition-all flex items-center justify-center gap-1 shadow-lg shadow-emerald-500/10"
                        >
                          {actionLoadingId === offer.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" /> Aceptar
                            </>
                          )}
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
