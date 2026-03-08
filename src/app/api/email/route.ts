import { NextRequest, NextResponse } from "next/server";
import {
  enviarEmailSolicitudRecibida,
  enviarEmailSolicitudAceptada,
  enviarEmailSolicitudRechazada,
  enviarEmailContratoListo,
  enviarEmailPagoRecibido,
} from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tipo, ...params } = body;

    switch (tipo) {
      case "solicitud_recibida":
        await enviarEmailSolicitudRecibida(params);
        break;
      case "solicitud_aceptada":
        await enviarEmailSolicitudAceptada(params);
        break;
      case "solicitud_rechazada":
        await enviarEmailSolicitudRechazada(params);
        break;
      case "contrato_listo":
        await enviarEmailContratoListo(params);
        break;
      case "pago_recibido":
        await enviarEmailPagoRecibido(params);
        break;
      default:
        return NextResponse.json(
          { error: `Tipo de email desconocido: ${tipo}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error en API email:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
