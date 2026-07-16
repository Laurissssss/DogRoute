import Link from "next/link";
import { ArrowLeft, ShieldCheck, Scale, CircleDollarSign, Users, Award } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="relative min-h-screen bg-[#0b0f19] text-white font-sans pb-24 select-none">
      {/* Background Decor Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-br from-amber-500/5 to-rose-500/5 blur-[120px] pointer-events-none" />

      {/* Header bar */}
      <header className="relative z-10 max-w-4xl mx-auto w-full px-4 sm:px-6 h-20 flex items-center justify-between border-b border-slate-900/60">
        <Link 
          href="/"
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al Inicio
        </Link>
        <span className="text-xs font-black tracking-widest text-slate-500 uppercase">
          Términos de Servicio
        </span>
      </header>

      {/* Main content layout */}
      <main className="relative z-10 max-w-3xl mx-auto w-full px-4 sm:px-6 py-12 space-y-12">
        
        {/* Title Heading */}
        <div className="space-y-4">
          <span className="text-[10px] font-bold tracking-wider text-violet-400 uppercase bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20">
            Legal & Privacidad
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
            Políticas de Privacidad y Términos de Servicio de DogRoute
          </h1>
          <p className="text-xs text-slate-500">Última actualización: 15 de Julio de 2026</p>
        </div>

        {/* Informative Grid Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-[#161c2a]/40 border border-slate-900 rounded-2xl space-y-2">
            <ShieldCheck className="w-6 h-6 text-violet-400" />
            <h4 className="font-bold text-xs text-white">Protección de Datos</h4>
            <p className="text-[10px] text-slate-500">Tus datos personales y de tus mascotas están resguardados bajo estándares estrictos de encriptación.</p>
          </div>
          <div className="p-4 bg-[#161c2a]/40 border border-slate-900 rounded-2xl space-y-2">
            <CircleDollarSign className="w-6 h-6 text-emerald-450" />
            <h4 className="font-bold text-xs text-white">Comisión del 15%</h4>
            <p className="text-[10px] text-slate-500">Se aplica una tarifa fija del 15% sobre el precio de cada paseo para el sustento de la plataforma y el seguro.</p>
          </div>
          <div className="p-4 bg-[#161c2a]/40 border border-slate-900 rounded-2xl space-y-2">
            <Award className="w-6 h-6 text-amber-500" />
            <h4 className="font-bold text-xs text-white">Garantía del Servicio</h4>
            <p className="text-[10px] text-slate-500">El dinero de los clientes es liberado al paseador únicamente cuando se completa el viaje satisfactoriamente.</p>
          </div>
        </div>

        {/* Detailed Sections (Typography styled) */}
        <div className="space-y-8 text-sm text-slate-400 leading-relaxed border-t border-slate-900/60 pt-8">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-xs font-mono text-violet-500 font-bold bg-violet-500/10 px-2 py-0.5 rounded">1.</span>
              Aceptación de los Términos
            </h3>
            <p>
              Al registrarte en **DogRoute**, declaras ser mayor de edad y aceptas cumplir de forma vinculante con las políticas y reglas de la comunidad detalladas en este documento. El servicio está diseñado para conectar de manera autónoma a dueños de mascotas y paseadores bajo un esquema descentralizado.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-xs font-mono text-violet-500 font-bold bg-violet-500/10 px-2 py-0.5 rounded">2.</span>
              Esquema de Tarifas y Modelo de Negocio
            </h3>
            <p>
              DogRoute opera bajo el modelo InDriver: el dueño del perro propone un precio base al solicitar el paseo, el cual puede ser aceptado, rechazado o contraofertado por el paseador de forma autónoma.
            </p>
            <ul className="list-disc list-inside pl-4 text-xs space-y-1.5 text-slate-500">
              <li>**El 85% del valor pactado** va de forma directa a la cuenta de retiro del paseador profesional.</li>
              <li>**El 15% restante** es retenido por DogRoute como comisión operativa para el mantenimiento de los servidores, geolocalización y el fondo de seguro de emergencias veterinarias.</li>
              <li>El pago del paseo se realiza de forma anticipada y queda retenido en garantía hasta que el paseador presiona "Terminar Paseo".</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-xs font-mono text-violet-500 font-bold bg-violet-500/10 px-2 py-0.5 rounded">3.</span>
              Políticas de Privacidad y Geolocalización
            </h3>
            <p>
              Para que la aplicación funcione, los paseadores deben otorgar permisos de geolocalización en segundo plano al iniciar un recorrido. DogRoute recolecta y transmite estas coordenadas en vivo al cliente dueño de la mascota. Esta transmisión de GPS se apaga automáticamente en el momento en que el paseo finaliza.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-xs font-mono text-violet-500 font-bold bg-violet-500/10 px-2 py-0.5 rounded">4.</span>
              Responsabilidad Civil y Seguridad de las Mascotas
            </h3>
            <p>
              Los paseadores profesionales son contratistas autónomos. Es responsabilidad del paseador asegurarse de que cuenta con los implementos adecuados (correas, bozal de ser necesario, bolsas de aseo) y la condición física para controlar al perro según el tamaño declarado. Los dueños tienen el deber de declarar con veracidad la raza, tamaño y temperamento de su mascota en el onboarding inicial.
            </p>
          </section>

        </div>

        {/* Small contact alert at the bottom */}
        <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-2xl text-center text-xs text-slate-500">
          ¿Tienes alguna duda sobre nuestras políticas? Escríbenos a <span className="text-violet-400 hover:underline cursor-pointer">soporte@dogroute.com</span>
        </div>

      </main>
    </div>
  );
}
