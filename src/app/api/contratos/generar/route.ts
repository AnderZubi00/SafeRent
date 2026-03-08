import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

async function generarPDF(datos: {
  vivienda: { titulo: string; direccion: string; ciudad: string; numRegistro: string; precioMes: number; fianza: number };
  propietario: { nombre: string; email: string; dni: string };
  inquilino: { nombre: string; email: string; dni: string };
  fechaInicio: string;
  fechaFin: string;
  motivo: string;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();
  const margin = 50;
  let y = height - margin;

  const dark = rgb(0.12, 0.16, 0.21);
  const accent = rgb(0.31, 0.27, 0.89);
  const gray = rgb(0.39, 0.45, 0.53);

  // Header
  page.drawText("CONTRATO DE ARRENDAMIENTO", { x: margin, y, font: fontBold, size: 18, color: dark });
  y -= 22;
  page.drawText("DE VIVIENDA TEMPORAL", { x: margin, y, font: fontBold, size: 18, color: dark });
  y -= 18;
  page.drawText(`Generado por SafeRent · ${formatDate(new Date().toISOString())}`, { x: margin, y, font, size: 9, color: gray });
  y -= 6;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 2, color: accent });
  y -= 30;

  function sectionTitle(text: string) {
    page.drawText(text, { x: margin, y, font: fontBold, size: 12, color: accent });
    y -= 6;
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: rgb(0.89, 0.91, 0.94) });
    y -= 16;
  }

  function row(label: string, value: string) {
    page.drawText(label, { x: margin, y, font: fontBold, size: 9, color: gray });
    page.drawText(value, { x: margin + 140, y, font, size: 9, color: dark });
    y -= 16;
  }

  function paragraph(text: string) {
    const words = text.split(" ");
    let line = "";
    const maxW = width - margin * 2;
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(test, 9.5) > maxW) {
        page.drawText(line, { x: margin, y, font, size: 9.5, color: dark });
        y -= 14;
        line = w;
      } else {
        line = test;
      }
    }
    if (line) {
      page.drawText(line, { x: margin, y, font, size: 9.5, color: dark });
      y -= 14;
    }
    y -= 6;
  }

  // Partes intervinientes
  sectionTitle("PARTES INTERVINIENTES");

  page.drawText("ARRENDADOR (Propietario)", { x: margin, y, font: fontBold, size: 10, color: dark });
  y -= 16;
  row("Nombre completo:", datos.propietario.nombre);
  row("DNI/NIE:", datos.propietario.dni);
  row("Email:", datos.propietario.email);
  y -= 6;

  page.drawText("ARRENDATARIO (Inquilino)", { x: margin, y, font: fontBold, size: 10, color: dark });
  y -= 16;
  row("Nombre completo:", datos.inquilino.nombre);
  row("DNI/NIE:", datos.inquilino.dni);
  row("Email:", datos.inquilino.email);
  y -= 10;

  // Objeto del contrato
  sectionTitle("OBJETO DEL CONTRATO");
  row("Vivienda:", datos.vivienda.titulo);
  row("Direccion:", `${datos.vivienda.direccion}, ${datos.vivienda.ciudad}`);
  row("N. Registro:", datos.vivienda.numRegistro);
  row("Motivo estancia:", datos.motivo);
  y -= 10;

  // Condiciones economicas
  const meses = Math.max(1, Math.round((new Date(datos.fechaFin).getTime() - new Date(datos.fechaInicio).getTime()) / (1000 * 60 * 60 * 24 * 30)));

  sectionTitle("CONDICIONES ECONOMICAS");
  row("Renta mensual:", `${datos.vivienda.precioMes.toLocaleString("es-ES")} EUR`);
  row("Fianza:", `${datos.vivienda.fianza.toLocaleString("es-ES")} EUR`);
  row("Duracion:", `${meses} meses (del ${formatDate(datos.fechaInicio)} al ${formatDate(datos.fechaFin)})`);
  y -= 10;

  // Clausulas
  sectionTitle("CLAUSULAS");

  page.drawText("PRIMERA. Objeto", { x: margin, y, font: fontBold, size: 9.5, color: dark });
  y -= 14;
  paragraph(`El arrendador cede al arrendatario el uso temporal de la vivienda descrita, destinada exclusivamente a satisfacer la necesidad de alojamiento temporal del arrendatario por motivo de: ${datos.motivo.toLowerCase()}.`);

  page.drawText("SEGUNDA. Duracion", { x: margin, y, font: fontBold, size: 9.5, color: dark });
  y -= 14;
  paragraph(`El presente contrato tendra una duracion de ${meses} meses, desde el ${formatDate(datos.fechaInicio)} hasta el ${formatDate(datos.fechaFin)}, sin posibilidad de prorroga tacita al tratarse de un arrendamiento de uso distinto de vivienda habitual.`);

  page.drawText("TERCERA. Renta y fianza", { x: margin, y, font: fontBold, size: 9.5, color: dark });
  y -= 14;
  paragraph(`La renta mensual se fija en ${datos.vivienda.precioMes.toLocaleString("es-ES")} EUR, pagaderos dentro de los primeros cinco dias de cada mes. Se constituye una fianza de ${datos.vivienda.fianza.toLocaleString("es-ES")} EUR que sera devuelta al finalizar el contrato, previa verificacion del estado de la vivienda.`);

  page.drawText("CUARTA. Pago seguro", { x: margin, y, font: fontBold, size: 9.5, color: dark });
  y -= 14;
  paragraph("Los pagos se realizan a traves de la plataforma SafeRent mediante sistema de escrow. El importe queda retenido hasta la confirmacion de entrada del inquilino en la vivienda.");

  // Firmas
  y -= 20;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: rgb(0.89, 0.91, 0.94) });
  y -= 50;

  // Firma propietario
  page.drawLine({ start: { x: margin, y }, end: { x: margin + 180, y }, thickness: 0.5, color: rgb(0.58, 0.64, 0.72) });
  y -= 12;
  page.drawText("EL ARRENDADOR (Propietario)", { x: margin, y, font, size: 8, color: gray });
  y -= 12;
  page.drawText(datos.propietario.nombre, { x: margin, y, font, size: 8, color: dark });

  // Firma inquilino (right side)
  const rightX = width - margin - 180;
  y += 24;
  page.drawLine({ start: { x: rightX, y: y + 12 }, end: { x: rightX + 180, y: y + 12 }, thickness: 0.5, color: rgb(0.58, 0.64, 0.72) });
  page.drawText("EL ARRENDATARIO (Inquilino)", { x: rightX, y, font, size: 8, color: gray });
  y -= 12;
  page.drawText(datos.inquilino.nombre, { x: rightX, y, font, size: 8, color: dark });

  // Footer
  page.drawText(
    "Documento generado digitalmente por SafeRent · Plataforma de alquiler temporal seguro",
    { x: margin, y: 30, font, size: 7, color: rgb(0.58, 0.64, 0.72) }
  );

  return doc.save();
}

export async function POST(req: NextRequest) {
  try {
    const { solicitudId } = await req.json();
    if (!solicitudId)
      return NextResponse.json({ error: "solicitudId requerido" }, { status: 400 });

    const supabase = await getSupabase();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    // Fetch solicitud with related vivienda
    const { data: solicitud, error: solErr } = await supabase
      .from("solicitudes")
      .select("*, viviendas(id, titulo, direccion, ciudad, precio_mes, fianza_importe, num_registro_vivienda)")
      .eq("id", solicitudId)
      .single();

    if (solErr || !solicitud) {
      console.error("Error fetching solicitud:", solErr);
      return NextResponse.json({ error: "Solicitud no encontrada: " + (solErr?.message ?? "") }, { status: 404 });
    }

    // Fetch inquilino and propietario
    const [{ data: inquilino, error: inqErr }, { data: propietario, error: propErr }] = await Promise.all([
      supabase.from("usuarios").select("nombre_completo, email, dni_nie").eq("id", solicitud.inquilino_id).single(),
      supabase.from("usuarios").select("nombre_completo, email, dni_nie").eq("id", solicitud.propietario_id).single(),
    ]);

    if (!inquilino || !propietario) {
      console.error("Error fetching users:", inqErr, propErr);
      return NextResponse.json({ error: "Datos de usuarios no encontrados" }, { status: 404 });
    }

    const vivienda = solicitud.viviendas;

    // Generate PDF with pdf-lib
    const pdfBytes = await generarPDF({
      vivienda: {
        titulo: vivienda.titulo,
        direccion: vivienda.direccion,
        ciudad: vivienda.ciudad,
        numRegistro: vivienda.num_registro_vivienda,
        precioMes: vivienda.precio_mes,
        fianza: vivienda.fianza_importe,
      },
      propietario: {
        nombre: propietario.nombre_completo,
        email: propietario.email,
        dni: propietario.dni_nie ?? "No proporcionado",
      },
      inquilino: {
        nombre: inquilino.nombre_completo,
        email: inquilino.email,
        dni: inquilino.dni_nie ?? "No proporcionado",
      },
      fechaInicio: solicitud.fecha_entrada,
      fechaFin: solicitud.fecha_salida,
      motivo: solicitud.motivo,
    });

    // Upload to Storage
    const pdfPath = `${solicitudId}/contrato-${Date.now()}.pdf`;
    const { error: uploadErr } = await supabase.storage
      .from("contratos-pdf")
      .upload(pdfPath, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadErr) {
      console.error("Error uploading PDF:", uploadErr);
      return NextResponse.json({ error: "Error al subir PDF: " + uploadErr.message }, { status: 500 });
    }

    const pdfUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/contratos-pdf/${pdfPath}`;

    // Create contrato record (reserva_id is now nullable)
    const { data: contrato, error: contratoErr } = await supabase
      .from("contratos_digitales")
      .insert({
        solicitud_id: solicitudId,
        pdf_borrador_url: pdfUrl,
        firmado_propietario: false,
        firmado_inquilino: false,
      })
      .select()
      .single();

    if (contratoErr) {
      console.error("Error creating contrato:", contratoErr);
      return NextResponse.json({ error: "Error al crear contrato: " + contratoErr.message }, { status: 500 });
    }

    return NextResponse.json({ contrato, pdfUrl });
  } catch (err) {
    console.error("Error generando contrato:", err);
    return NextResponse.json(
      { error: "Error interno: " + (err instanceof Error ? err.message : String(err)) },
      { status: 500 }
    );
  }
}
