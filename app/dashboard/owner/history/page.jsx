"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { 
  History, 
  Dog, 
  User, 
  Calendar, 
  DollarSign, 
  Star, 
  MessageSquare, 
  X, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  ArrowLeft 
} from "lucide-react";

export default function OwnerHistory() {
  const router = useRouter();

  // Data states
  const [walks, setWalks] = useState([]);
  const [userId, setUserId] = useState(null);
  
  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWalkForReview, setSelectedWalkForReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Fetch walks history
  const fetchWalksHistory = async () => {
    try {
      setIsLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);

      // Query walks with related dog, walker, and check if a review already exists
      const { data: walksData, error: walksError } = await supabase
        .from("walks")
        .select(`
          *,
          dog:dog_id (name, breed),
          walker:walker_id (full_name),
          reviews (id, rating, comment)
        `)
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      if (walksError) throw walksError;
      setWalks(walksData || []);
    } catch (err) {
      console.error("Error loading walks history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWalksHistory();
  }, [router]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedWalkForReview) return;
    if (rating < 1 || rating > 5) {
      setReviewError("Por favor, selecciona una calificación de 1 a 5 estrellas.");
      return;
    }

    setIsSubmittingReview(true);
    setReviewError("");

    try {
      // Insert review in the reviews table
      const { error } = await supabase.from("reviews").insert({
        walk_id: selectedWalkForReview.id,
        rating: rating,
        comment: comment.trim() || null,
      });

      if (error) throw error;

      setReviewSuccess(true);
      
      // Reload history list
      await fetchWalksHistory();

      setTimeout(() => {
        setSelectedWalkForReview(null);
        setReviewSuccess(false);
        setComment("");
        setRating(5);
      }, 1500);

    } catch (err) {
      console.error("Error submitting review:", err);
      setReviewError("No se pudo guardar tu calificación. Inténtalo de nuevo.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Helper to render state badges with correct style colors
  const renderStatusBadge = (status) => {
    let colorClass = "bg-slate-800 text-slate-400 border-slate-700";
    let label = status;

    switch (status) {
      case "requested":
        colorClass = "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
        label = "Solicitado";
        break;
      case "accepted":
        colorClass = "bg-blue-500/10 text-blue-400 border-blue-500/20";
        label = "Aceptado";
        break;
      case "paid":
        colorClass = "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
        label = "Pagado";
        break;
      case "ongoing":
        colorClass = "bg-violet-500/10 text-violet-400 border-violet-500/20 animate-pulse";
        label = "En Progreso";
        break;
      case "completed":
        colorClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
        label = "Completado";
        break;
      case "cancelled":
        colorClass = "bg-rose-500/10 text-rose-400 border-rose-500/20";
        label = "Cancelado";
        break;
    }

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colorClass}`}>
        {label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 text-violet-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Cargando historial de paseos...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0b0f19] text-white font-sans pb-24">
      {/* Aurora Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-violet-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-amber-500/5 blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        
        {/* Navigation back and header */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/owner"
            className="p-3 bg-[#161c2a]/50 hover:bg-[#1e273b] border border-slate-800 rounded-xl transition-all text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <History className="w-6 h-6 text-violet-500" /> Historial de Paseos
            </h1>
            <p className="text-xs text-slate-400 mt-1">Revisa el registro de tus paseos y califica a tus paseadores</p>
          </div>
        </div>

        {/* WALKS LIST */}
        {walks.length === 0 ? (
          <div className="p-12 text-center bg-[#161c2a]/30 border border-slate-800 rounded-3xl">
            <History className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 mb-4">Aún no has solicitado ningún paseo en la plataforma.</p>
            <Link
              href="/dashboard/owner"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all"
            >
              Pedir tu primer paseo
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {walks.map((walk) => {
              // Check if a review already exists
              const reviewObj = walk.reviews?.[0] || null;
              const isReviewed = !!reviewObj;

              return (
                <div 
                  key={walk.id}
                  className="bg-[#161c2a]/50 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/60 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6"
                >
                  {/* Left Side: Dog, Walker, Date details */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> 
                        {new Date(walk.created_at).toLocaleDateString("es-CO", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </span>
                      {renderStatusBadge(walk.status)}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Mascot Details */}
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                          <Dog className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500">Mascota</p>
                          <p className="text-xs font-bold text-white">{walk.dog?.name || "Mascota"}</p>
                        </div>
                      </div>

                      {/* Walker Details */}
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500">Paseador</p>
                          <p className="text-xs font-bold text-white">
                            {walk.walker?.full_name || "Buscando paseador..."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Price, Rating status, Action Buttons */}
                  <div className="w-full sm:w-auto flex sm:flex-col items-between sm:items-end justify-between gap-4 border-t sm:border-t-0 border-slate-800/60 pt-4 sm:pt-0 shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Costo Total</span>
                      <span className="text-base font-extrabold text-white flex items-center gap-0.5 mt-0.5">
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                        {parseFloat(walk.price).toLocaleString("es-CO")}
                      </span>
                    </div>

                    {/* Action button conditional view */}
                    <div>
                      {walk.status === "completed" && (
                        isReviewed ? (
                          /* Reviewed view (Read only rating summary) */
                          <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-amber-400">
                            <Star className="w-3.5 h-3.5 fill-amber-500" />
                            <span className="font-extrabold">{reviewObj.rating}</span>
                            <span className="text-slate-500">/ 5 calificado</span>
                          </div>
                        ) : (
                          /* Button to review */
                          <button
                            onClick={() => setSelectedWalkForReview(walk)}
                            className="flex items-center justify-center gap-1 py-2 px-4 rounded-xl bg-violet-650 hover:bg-violet-600 text-white text-xs font-bold transition-all shadow-md shadow-violet-600/10"
                          >
                            <Star className="w-3.5 h-3.5 fill-white" /> Calificar Paseo
                          </button>
                        )
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* RATING MODAL (GLASSMORPHIC CALIFICACIONES) */}
      {selectedWalkForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-[#161c2a] border border-slate-800 rounded-3xl p-6 shadow-2xl animate-fade-in">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-extrabold text-lg text-white">Calificar Paseador</h3>
              <button 
                onClick={() => setSelectedWalkForReview(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reviewSuccess ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 mb-4 animate-pulse">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-white font-bold mb-1">¡Calificación Enviada!</h4>
                <p className="text-xs text-slate-400">Gracias por tu valiosa retroalimentación.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-5">
                
                {/* Details Summary of Walk */}
                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-400">
                  <p>Mascota: <strong className="text-white">{selectedWalkForReview.dog?.name}</strong></p>
                  <p>Paseador: <strong className="text-white">{selectedWalkForReview.walker?.full_name}</strong></p>
                </div>

                {/* Stars Interactive Rating */}
                <div className="space-y-2 text-center py-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                    ¿Qué calificación le das a este paseo?
                  </label>
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((starValue) => {
                      const isActive = hoverRating ? starValue <= hoverRating : starValue <= rating;
                      return (
                        <button
                          key={starValue}
                          type="button"
                          onMouseEnter={() => setHoverRating(starValue)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(starValue)}
                          className="p-1 text-slate-600 hover:scale-125 transition-transform"
                        >
                          <Star 
                            className={`w-8 h-8 transition-colors ${
                              isActive 
                                ? "fill-amber-500 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]" 
                                : "text-slate-700"
                            }`} 
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Comment Textarea */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                    Comentario u Opinión (Opcional)
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 text-slate-500 pointer-events-none">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <textarea
                      placeholder="Cuéntanos qué te pareció el servicio, puntualidad, etc..."
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm resize-none"
                    />
                  </div>
                </div>

                {/* Error Banner */}
                {reviewError && (
                  <div className="flex items-center gap-2 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{reviewError}</span>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold transition-all duration-200 shadow-lg disabled:opacity-50 text-sm"
                >
                  {isSubmittingReview ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Enviando Calificación...
                    </>
                  ) : (
                    <>
                      Enviar Calificación
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
