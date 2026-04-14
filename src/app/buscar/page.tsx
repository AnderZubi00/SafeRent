"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  MapPin, Shield, SlidersHorizontal, Star, BedDouble, Bath,
  Search, Maximize2, ArrowRight, Building2, Home, X, Loader2,
  AlertCircle, RefreshCw,
} from "lucide-react";
import { obtenerViviendas, type Vivienda } from "@/lib/viviendas";
import { getAllProvincias, getCiudadesByProvincia } from "@/data/spain-locations";

const CARD_COLORS = [
  "from-indigo-500 to-indigo-700",
  "from-teal-500 to-teal-700",
  "from-slate-500 to-slate-700",
  "from-amber-500 to-amber-700",
  "from-rose-500 to-rose-700",
  "from-violet-500 to-violet-700",
  "from-emerald-500 to-emerald-700",
  "from-sky-500 to-sky-700",
];

function getColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash << 5) - hash + id.charCodeAt(i);
  return CARD_COLORS[Math.abs(hash) % CARD_COLORS.length];
}

const MOTIVOS_OPCIONES = ["Estudios", "Trabajo temporal", "Otros"];
const TODAS_PROVINCIAS = getAllProvincias();

export default function BuscarPage() {
  return (
    <Suspense>
      <BuscarContent />
    </Suspense>
  );
}

function BuscarContent() {
  const searchParams = useSearchParams();
  const ciudadParam = searchParams.get("ciudad") ?? "";

  const [viviendas, setViviendas] = useState<Vivienda[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filtros en estado local — pre-fill busqueda from URL param
  const [busqueda, setBusqueda] = useState(ciudadParam);
  const [provinciaFiltro, setProvinciaFiltro] = useState("todas");
  const [ciudadFiltro, setCiudadFiltro] = useState("todas");
  const ciudadesDisponibles = provinciaFiltro !== "todas" ? getCiudadesByProvincia(provinciaFiltro) : [];
  const [motivoFiltro, setMotivoFiltro] = useState("todos");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [habFiltro, setHabFiltro] = useState(0); // 0 = todas
  const [soloVerificadas, setSoloVerificadas] = useState(false);
  const [ordenFiltro, setOrdenFiltro] = useState("recientes");
  const [fechaEntrada, setFechaEntrada] = useState("");
  const [fechaSalida, setFechaSalida] = useState("");

  const cargarViviendas = useCallback(async () => {
    setCargando(true);
    setErrorMsg(null);
    // Resolve provincia name from code for backend filter
    const provName = provinciaFiltro !== "todas"
      ? TODAS_PROVINCIAS.find(p => p.code === provinciaFiltro)?.name
      : undefined;
    const { data, error } = await obtenerViviendas({
      provincia: provName,
      ciudad: ciudadFiltro,
      motivo: motivoFiltro,
      precioMin: precioMin ? Number(precioMin) : undefined,
      precioMax: precioMax ? Number(precioMax) : undefined,
      habitaciones: habFiltro,
      soloVerificadas: soloVerificadas || undefined,
      ...(fechaEntrada && { fechaEntrada }),
      ...(fechaSalida && { fechaSalida }),
    });
    setCargando(false);
    if (error) { setErrorMsg(error); return; }
    setViviendas(data);
  }, [provinciaFiltro, ciudadFiltro, motivoFiltro, precioMin, precioMax, habFiltro, soloVerificadas, fechaEntrada, fechaSalida]);

  useEffect(() => {
    cargarViviendas();
  }, [cargarViviendas]);

  // Filtrado local (texto libre + verificadas + orden)
  const viviendasFiltradas = viviendas
    .filter((v) => {
      if (soloVerificadas && !v.verificada) return false;
      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase();
      return (
        v.titulo.toLowerCase().includes(q) ||
        v.ciudad.toLowerCase().includes(q) ||
        (v.provincia ?? "").toLowerCase().includes(q) ||
        v.direccion.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (ordenFiltro === "precio_asc") return a.precio_mes - b.precio_mes;
      if (ordenFiltro === "precio_desc") return b.precio_mes - a.precio_mes;
      return new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime();
    });

  // Chips de filtros activos
  type ActiveFilter = { label: string; remove: () => void };
  const filtrosActivos: ActiveFilter[] = [];
  if (provinciaFiltro !== "todas") filtrosActivos.push({ label: TODAS_PROVINCIAS.find(p => p.code === provinciaFiltro)?.name ?? provinciaFiltro, remove: () => { setProvinciaFiltro("todas"); setCiudadFiltro("todas"); } });
  if (ciudadFiltro !== "todas") filtrosActivos.push({ label: ciudadFiltro.split("-")[0], remove: () => setCiudadFiltro("todas") });
  if (motivoFiltro !== "todos") filtrosActivos.push({ label: motivoFiltro, remove: () => setMotivoFiltro("todos") });
  if (precioMin) filtrosActivos.push({ label: `Desde ${precioMin}€`, remove: () => setPrecioMin("") });
  if (precioMax) filtrosActivos.push({ label: `Hasta ${precioMax}€`, remove: () => setPrecioMax("") });
  if (habFiltro > 0) filtrosActivos.push({ label: `${habFiltro}+ hab.`, remove: () => setHabFiltro(0) });
  if (soloVerificadas) filtrosActivos.push({ label: "Solo verificadas", remove: () => setSoloVerificadas(false) });
  if (fechaEntrada || fechaSalida) filtrosActivos.push({ label: `${fechaEntrada || "??"} → ${fechaSalida || "??"}`, remove: () => { setFechaEntrada(""); setFechaSalida(""); } });

  function resetFiltros() {
    setProvinciaFiltro("todas");
    setCiudadFiltro("todas");
    setMotivoFiltro("todos");
    setPrecioMin("");
    setPrecioMax("");
    setHabFiltro(0);
    setBusqueda("");
    setSoloVerificadas(false);
    setFechaEntrada("");
    setFechaSalida("");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Barra de búsqueda hero */}
      <div className="bg-white border-b border-slate-200 pt-[68px]">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Buscar por ciudad, barrio o tipo de vivienda..."
                className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              {busqueda && (
                <button onClick={() => setBusqueda("")}>
                  <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <select
                className="rounded-xl ring-1 ring-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                value={provinciaFiltro}
                onChange={(e) => { setProvinciaFiltro(e.target.value); setCiudadFiltro("todas"); }}
              >
                <option value="todas">Provincia</option>
                {TODAS_PROVINCIAS.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
              </select>
              <select
                className="rounded-xl ring-1 ring-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                value={ciudadFiltro}
                onChange={(e) => setCiudadFiltro(e.target.value)}
                disabled={provinciaFiltro === "todas"}
              >
                <option value="todas">{provinciaFiltro === "todas" ? "Ciudad" : "Todas las ciudades"}</option>
                {ciudadesDisponibles.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                className="rounded-xl ring-1 ring-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                value={motivoFiltro}
                onChange={(e) => setMotivoFiltro(e.target.value)}
              >
                <option value="todos">Motivo de estancia</option>
                {MOTIVOS_OPCIONES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 rounded-xl shadow-sm" onClick={cargarViviendas}>
                <Search className="h-4 w-4 mr-2" /> Buscar
              </Button>
            </div>
          </div>

          {/* Filtros activos */}
          {filtrosActivos.length > 0 && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400">Filtros:</span>
              {filtrosActivos.map((f) => (
                <button
                  key={f.label}
                  onClick={f.remove}
                  className="inline-flex items-center gap-1 text-xs font-medium bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full ring-1 ring-indigo-200 cursor-pointer hover:bg-indigo-100 transition-colors"
                >
                  {f.label}
                  <X className="h-3 w-3 text-indigo-400" />
                </button>
              ))}
              <button onClick={resetFiltros} className="text-xs text-slate-400 hover:text-slate-600 transition-colors ml-1">
                Limpiar todos
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="flex gap-6">
          {/* Filtros sidebar */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="bg-white rounded-2xl ring-1 ring-slate-200 shadow-sm overflow-hidden sticky top-24">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-slate-600" />
                  <h3 className="font-semibold text-slate-900 text-sm">Filtros</h3>
                </div>
                <button onClick={resetFiltros} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                  Reiniciar
                </button>
              </div>

              {/* Toggle verificadas */}
              <button
                onClick={() => setSoloVerificadas(!soloVerificadas)}
                className={`mx-4 mt-4 flex items-center gap-2.5 rounded-xl px-3.5 py-3 w-[calc(100%-2rem)] transition-all ${
                  soloVerificadas
                    ? "bg-emerald-500 ring-1 ring-emerald-500"
                    : "bg-emerald-50 ring-1 ring-emerald-200 hover:bg-emerald-100"
                }`}
              >
                <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${soloVerificadas ? "bg-white" : "bg-emerald-500"}`}>
                  <Shield className={`h-3.5 w-3.5 ${soloVerificadas ? "text-emerald-600" : "text-white"}`} />
                </div>
                <div className="text-left">
                  <p className={`text-xs font-semibold ${soloVerificadas ? "text-white" : "text-emerald-800"}`}>Solo verificadas</p>
                  <p className={`text-[10px] leading-tight mt-0.5 ${soloVerificadas ? "text-emerald-100" : "text-emerald-600"}`}>
                    {soloVerificadas ? "Activo — mostrando verificadas" : "Ver solo con sello SafeRent"}
                  </p>
                </div>
              </button>

              <div className="p-5 space-y-5">
                {/* Precio */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-900 flex items-center justify-between">
                    Precio mensual
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Min €"
                      type="number"
                      value={precioMin}
                      onChange={(e) => setPrecioMin(e.target.value)}
                      className="text-sm ring-1 ring-slate-200 border-0 h-9 text-center"
                    />
                    <span className="text-slate-300 self-center">—</span>
                    <Input
                      placeholder="Max €"
                      type="number"
                      value={precioMax}
                      onChange={(e) => setPrecioMax(e.target.value)}
                      className="text-sm ring-1 ring-slate-200 border-0 h-9 text-center"
                    />
                  </div>
                </div>

                <Separator className="bg-slate-100" />

                {/* Disponibilidad */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-900">Disponibilidad</label>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Entrada</p>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={fechaEntrada}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFechaEntrada(val);
                          if (fechaSalida && val >= fechaSalida) setFechaSalida("");
                        }}
                        className="w-full text-sm ring-1 ring-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:ring-offset-0 bg-white text-slate-700"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Salida</p>
                      <input
                        type="date"
                        min={fechaEntrada || new Date().toISOString().split('T')[0]}
                        value={fechaSalida}
                        onChange={(e) => setFechaSalida(e.target.value)}
                        disabled={!fechaEntrada}
                        className="w-full text-sm ring-1 ring-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:ring-offset-0 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                      />
                    </div>
                    {(fechaEntrada || fechaSalida) && (
                      <button
                        onClick={() => { setFechaEntrada(""); setFechaSalida(""); }}
                        className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        Limpiar fechas
                      </button>
                    )}
                  </div>
                </div>

                <Separator className="bg-slate-100" />

                {/* Habitaciones */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-900">Habitaciones</label>
                  <div className="flex gap-1.5">
                    {[{ label: "Todas", val: 0 }, { label: "1", val: 1 }, { label: "2", val: 2 }, { label: "3", val: 3 }, { label: "4+", val: 4 }].map((n) => (
                      <button
                        key={n.label}
                        onClick={() => setHabFiltro(n.val)}
                        className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                          habFiltro === n.val
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:ring-indigo-300 hover:text-indigo-600"
                        }`}
                      >
                        {n.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Separator className="bg-slate-100" />

                {/* Motivo */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-900">Motivo de estancia</label>
                  <div className="space-y-2">
                    {MOTIVOS_OPCIONES.map((m) => (
                      <label key={m} className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
                            checked={motivoFiltro === m}
                            onChange={() => setMotivoFiltro(motivoFiltro === m ? "todos" : m)}
                          />
                          <span className="text-sm text-slate-600 group-hover:text-slate-900">{m}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

              </div>

              <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50">
                <Button onClick={cargarViviendas} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm">
                  Aplicar filtros
                </Button>
              </div>
            </div>
          </aside>

          {/* Resultados */}
          <main className="flex-1 min-w-0">
            {/* Cabecera resultados */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="text-lg font-bold text-slate-900">
                  {cargando ? (
                    <span className="inline-block h-5 w-32 bg-slate-200 animate-pulse rounded" />
                  ) : (
                    `${viviendasFiltradas.length} vivienda${viviendasFiltradas.length !== 1 ? "s" : ""} disponible${viviendasFiltradas.length !== 1 ? "s" : ""}`
                  )}
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">Alquileres temporales{soloVerificadas ? " verificados" : ""}</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  className="rounded-lg ring-1 ring-slate-200 px-3 py-2 text-sm bg-white text-slate-700 outline-none cursor-pointer hover:ring-slate-300 transition-colors"
                  value={ordenFiltro}
                  onChange={(e) => setOrdenFiltro(e.target.value)}
                >
                  <option value="recientes">Más recientes</option>
                  <option value="precio_asc">Precio: menor a mayor</option>
                  <option value="precio_desc">Precio: mayor a menor</option>
                </select>
              </div>
            </div>

            {/* Estado de carga */}
            {cargando && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="rounded-2xl overflow-hidden ring-1 ring-slate-200 shadow-sm">
                    <div className="h-48 bg-slate-200 animate-pulse" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-slate-200 animate-pulse rounded w-3/4" />
                      <div className="h-3 bg-slate-100 animate-pulse rounded w-1/2" />
                      <div className="flex gap-2">
                        <div className="h-7 w-16 bg-slate-100 animate-pulse rounded-lg" />
                        <div className="h-7 w-16 bg-slate-100 animate-pulse rounded-lg" />
                        <div className="h-7 w-16 bg-slate-100 animate-pulse rounded-lg" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {!cargando && errorMsg && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="flex items-center gap-2 text-rose-600">
                  <AlertCircle className="h-5 w-5" />
                  <p className="font-medium">Error al cargar las viviendas</p>
                </div>
                <p className="text-sm text-slate-500">{errorMsg}</p>
                <Button variant="outline" onClick={cargarViviendas} className="gap-2">
                  <RefreshCw className="h-4 w-4" /> Reintentar
                </Button>
              </div>
            )}

            {/* Sin resultados */}
            {!cargando && !errorMsg && viviendasFiltradas.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                  <Home className="h-8 w-8 text-slate-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">No hay viviendas disponibles</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {filtrosActivos.length > 0
                      ? "Prueba a ajustar o limpiar los filtros"
                      : "Aún no hay viviendas publicadas. ¡Sé el primero en publicar!"}
                  </p>
                </div>
                {filtrosActivos.length > 0 && (
                  <Button variant="outline" onClick={resetFiltros} className="gap-2">
                    <X className="h-4 w-4" /> Limpiar filtros
                  </Button>
                )}
              </div>
            )}

            {/* Grid de resultados */}
            {!cargando && !errorMsg && viviendasFiltradas.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {viviendasFiltradas.map((v) => (
                  <Link href={`/vivienda/${v.id}`} key={v.id}>
                    <Card className="group overflow-hidden ring-1 ring-slate-200 shadow-sm border-0 hover:shadow-lg hover:ring-slate-300 transition-all duration-300 cursor-pointer">
                      {/* Imagen */}
                      <div className={`relative h-48 overflow-hidden ${v.fotos?.[0] ? "bg-slate-100" : `bg-linear-to-br ${getColor(v.id)}`} flex items-center justify-center`}>
                        {v.fotos?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={v.fotos[0]}
                            alt={v.titulo}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <>
                            <Home className="h-20 w-20 text-white/10 absolute" />
                            <Building2 className="h-10 w-10 text-white/60 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                          </>
                        )}

                        {/* Badge verificación */}
                        <div className="absolute top-3 left-3 flex gap-2">
                          {v.verificada ? (
                            <span className="flex items-center gap-1 bg-white/95 backdrop-blur-sm text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm ring-1 ring-emerald-200/50">
                              <Shield className="h-3 w-3" /> Verificada SafeRent
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 bg-white/80 backdrop-blur-sm text-slate-500 text-[10px] font-medium px-2.5 py-1 rounded-full shadow-sm ring-1 ring-slate-200/50">
                              Sin verificar
                            </span>
                          )}
                        </div>

                        {/* Badge nueva */}
                        <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm text-xs font-semibold px-2.5 py-1 rounded-full text-slate-700 shadow-sm">
                          <Star className="h-3 w-3 text-amber-400 fill-amber-400" /> Nueva
                        </div>

                        {/* Precio overlay */}
                        <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-sm">
                          <p className="text-lg font-bold text-slate-900 leading-none">{v.precio_mes}€</p>
                          <p className="text-[10px] text-slate-500 text-right">/mes</p>
                        </div>
                      </div>

                      {/* Contenido */}
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{v.titulo}</h3>
                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {v.ciudad}{v.provincia ? `, ${v.provincia}` : ""}
                        </p>

                        {/* Características */}
                        <div className="mt-3 flex items-center gap-3">
                          <span className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 ring-1 ring-slate-200 px-2.5 py-1.5 rounded-lg">
                            <BedDouble className="h-3.5 w-3.5 text-slate-400" />{v.habitaciones} hab.
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 ring-1 ring-slate-200 px-2.5 py-1.5 rounded-lg">
                            <Bath className="h-3.5 w-3.5 text-slate-400" />{v.banos} baño{v.banos !== 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 ring-1 ring-slate-200 px-2.5 py-1.5 rounded-lg">
                            <Maximize2 className="h-3.5 w-3.5 text-slate-400" />{v.m2} m²
                          </span>
                        </div>

                        {/* Motivos + CTA */}
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex gap-1.5 flex-wrap">
                            {v.motivos.slice(0, 3).map((m) => (
                              <span key={m} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium ring-1 ring-indigo-100">
                                {m}
                              </span>
                            ))}
                          </div>
                          <span className="text-xs text-indigo-600 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            Ver <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {/* Info bottom */}
            {!cargando && !errorMsg && viviendasFiltradas.length > 0 && (
              <div className="mt-6 text-center">
                <p className="text-xs text-slate-400">
                  Mostrando {viviendasFiltradas.length} vivienda{viviendasFiltradas.length !== 1 ? "s" : ""} · Todas verificadas y con documentación en regla
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
