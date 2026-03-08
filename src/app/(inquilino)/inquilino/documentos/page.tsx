"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Download,
  ExternalLink,
  CheckCircle2,
  Clock,
  Shield,
  User,
  GraduationCap,
  Briefcase,
  Loader2,
  Inbox,
  Search,
  X,
  MapPin,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useInquilino,
  type DocumentoInquilino,
} from "@/context/InquilinoContext";

const ESTADO_CONFIG = {
  firmado: {
    label: "Firmado",
    className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 border-0",
    icon: CheckCircle2,
  },
  verificado: {
    label: "Verificado",
    className: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 border-0",
    icon: Shield,
  },
  pendiente: {
    label: "Pendiente",
    className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 border-0",
    icon: Clock,
  },
  rechazado: {
    label: "Rechazado",
    className: "bg-rose-50 text-rose-700 ring-1 ring-rose-200 border-0",
    icon: X,
  },
} as const;

function getTipoIcon(tipo: DocumentoInquilino["tipo"]) {
  switch (tipo) {
    case "identidad":
      return User;
    case "temporalidad":
      return GraduationCap;
    case "contrato":
      return FileText;
  }
}

function getTipoBg(tipo: DocumentoInquilino["tipo"]) {
  switch (tipo) {
    case "identidad":
      return "bg-indigo-50 ring-indigo-200";
    case "temporalidad":
      return "bg-amber-50 ring-amber-200";
    case "contrato":
      return "bg-emerald-50 ring-emerald-200";
  }
}

function getTipoColor(tipo: DocumentoInquilino["tipo"]) {
  switch (tipo) {
    case "identidad":
      return "text-indigo-600";
    case "temporalidad":
      return "text-amber-600";
    case "contrato":
      return "text-emerald-600";
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function DocRow({ doc }: { doc: DocumentoInquilino }) {
  const conf = ESTADO_CONFIG[doc.estado];
  const EstadoIcon = conf.icon;
  const TipoIcon = getTipoIcon(doc.tipo);

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl ring-1 ring-slate-200 hover:shadow-sm transition-shadow bg-white">
      <div
        className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center ring-1 shrink-0",
          getTipoBg(doc.tipo)
        )}
      >
        <TipoIcon className={cn("h-5 w-5", getTipoColor(doc.tipo))} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">
          {doc.nombre}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {doc.viviendaTitulo}
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-xs text-slate-400">{formatDate(doc.fecha)}</span>
        </div>
      </div>

      <Badge className={cn("text-[10px] shrink-0", conf.className)}>
        <EstadoIcon className="h-3 w-3 mr-1" />
        {conf.label}
      </Badge>

      <div className="flex gap-1 shrink-0">
        <a href={doc.url} target="_blank" rel="noopener noreferrer">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-slate-500 hover:text-indigo-600"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </a>
        <a href={doc.url} download>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-slate-500 hover:text-indigo-600"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        </a>
      </div>
    </div>
  );
}

export default function DocumentosPage() {
  const { documentos, cargando } = useInquilino();

  const identidad = documentos.filter((d) => d.tipo === "identidad");
  const temporalidad = documentos.filter((d) => d.tipo === "temporalidad");
  const contratos = documentos.filter((d) => d.tipo === "contrato");

  const contratosFirmados = contratos.filter((d) => d.estado === "firmado").length;
  const docsVerificados = documentos.filter((d) => d.estado === "verificado").length;
  const pendientes = documentos.filter((d) => d.estado === "pendiente").length;

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (documentos.length === 0) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mis Documentos</h1>
          <p className="text-sm text-slate-500 mt-1">
            Repositorio de contratos y documentos verificados
          </p>
        </div>
        <div className="text-center py-20 space-y-4">
          <div className="h-16 w-16 rounded-full bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center mx-auto">
            <Inbox className="h-8 w-8 text-slate-300" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Sin documentos aún
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Cuando reserves una vivienda, tus documentos aparecerán aquí automáticamente.
            </p>
          </div>
          <Link href="/buscar">
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 shadow-sm">
              <Search className="h-4 w-4" /> Buscar alojamiento
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mis Documentos</h1>
        <p className="text-sm text-slate-500 mt-1">
          Repositorio de contratos y documentos verificados
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="ring-1 ring-slate-200 shadow-sm border-0">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-emerald-500/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{contratosFirmados}</p>
              <p className="text-xs text-slate-500">Contratos firmados</p>
            </div>
          </CardContent>
        </Card>

        <Card className="ring-1 ring-slate-200 shadow-sm border-0">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-indigo-500/10">
              <Shield className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{docsVerificados}</p>
              <p className="text-xs text-slate-500">Documentos verificados</p>
            </div>
          </CardContent>
        </Card>

        <Card className="ring-1 ring-slate-200 shadow-sm border-0">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{pendientes}</p>
              <p className="text-xs text-slate-500">Pendientes de revisión</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs by type */}
      <Tabs defaultValue="todos">
        <TabsList className="bg-slate-100 ring-1 ring-slate-200">
          <TabsTrigger value="todos" className="text-xs gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Todos
            <span className="ml-1 bg-slate-200 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {documentos.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="identidad" className="text-xs gap-1.5">
            <User className="h-3.5 w-3.5" />
            Identidad
            {identidad.length > 0 && (
              <span className="ml-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {identidad.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="temporalidad" className="text-xs gap-1.5">
            <Briefcase className="h-3.5 w-3.5" />
            Temporalidad
            {temporalidad.length > 0 && (
              <span className="ml-1 bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {temporalidad.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="contratos" className="text-xs gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Contratos
            {contratos.length > 0 && (
              <span className="ml-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {contratos.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="mt-4 space-y-3">
          {documentos.map((doc) => (
            <DocRow key={doc.id} doc={doc} />
          ))}
        </TabsContent>

        <TabsContent value="identidad" className="mt-4 space-y-3">
          {identidad.length > 0 ? (
            identidad.map((doc) => <DocRow key={doc.id} doc={doc} />)
          ) : (
            <EmptyTab tipo="identidad" />
          )}
        </TabsContent>

        <TabsContent value="temporalidad" className="mt-4 space-y-3">
          {temporalidad.length > 0 ? (
            temporalidad.map((doc) => <DocRow key={doc.id} doc={doc} />)
          ) : (
            <EmptyTab tipo="temporalidad" />
          )}
        </TabsContent>

        <TabsContent value="contratos" className="mt-4 space-y-3">
          {contratos.length > 0 ? (
            contratos.map((doc) => <DocRow key={doc.id} doc={doc} />)
          ) : (
            <EmptyTab tipo="contrato" />
          )}
        </TabsContent>
      </Tabs>

      {/* Footer summary */}
      <div className="bg-slate-50 ring-1 ring-slate-200 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>
            <strong className="text-slate-900">{documentos.length}</strong> documento{documentos.length !== 1 ? "s" : ""} total{documentos.length !== 1 ? "es" : ""}
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            {contratosFirmados + docsVerificados} verificado{contratosFirmados + docsVerificados !== 1 ? "s" : ""}
          </span>
          {pendientes > 0 && (
            <>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                {pendientes} pendiente{pendientes !== 1 ? "s" : ""}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyTab({ tipo }: { tipo: string }) {
  const config: Record<string, { icon: typeof FileText; label: string }> = {
    identidad: { icon: User, label: "documentos de identidad" },
    temporalidad: { icon: Briefcase, label: "justificantes de temporalidad" },
    contrato: { icon: FileText, label: "contratos" },
  };
  const c = config[tipo] ?? { icon: FileText, label: "documentos" };
  const Icon = c.icon;

  return (
    <div className="text-center py-12 space-y-3">
      <div className="h-12 w-12 rounded-full bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center mx-auto">
        <Icon className="h-6 w-6 text-slate-300" />
      </div>
      <p className="text-sm text-slate-500">
        No tienes {c.label} registrados.
      </p>
    </div>
  );
}
