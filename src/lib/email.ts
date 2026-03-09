import { Resend } from "resend";

let resend: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resend) resend = new Resend(key);
  return resend;
}

const FROM_EMAIL = "SafeRent <onboarding@resend.dev>";

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

async function enviarEmail({ to, subject, html }: EmailParams) {
  const client = getResend();
  if (!client) {
    console.log(`[Email mock] To: ${to} | Subject: ${subject}`);
    return;
  }

  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("Error enviando email:", err);
  }
}

export async function enviarEmailSolicitudRecibida(params: {
  propietarioEmail: string;
  propietarioNombre: string;
  inquilinoNombre: string;
  viviendaTitulo: string;
}) {
  await enviarEmail({
    to: params.propietarioEmail,
    subject: `Nueva solicitud de ${params.inquilinoNombre} para ${params.viviendaTitulo}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #1e293b;">Nueva solicitud de reserva</h2>
        <p style="color: #475569;">Hola ${params.propietarioNombre},</p>
        <p style="color: #475569;"><strong>${params.inquilinoNombre}</strong> ha solicitado reservar tu vivienda <strong>${params.viviendaTitulo}</strong>.</p>
        <p style="color: #475569;">Accede a tu panel de propietario para revisar la solicitud y aceptarla o rechazarla.</p>
        <div style="margin-top: 24px; padding: 16px; background: #f1f5f9; border-radius: 12px;">
          <p style="margin: 0; font-size: 14px; color: #64748b;">Revisa los documentos del inquilino y toma una decisión.</p>
        </div>
      </div>
    `,
  });
}

export async function enviarEmailSolicitudAceptada(params: {
  inquilinoEmail: string;
  inquilinoNombre: string;
  viviendaTitulo: string;
}) {
  await enviarEmail({
    to: params.inquilinoEmail,
    subject: `Tu solicitud para ${params.viviendaTitulo} ha sido aceptada`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #1e293b;">¡Solicitud aceptada!</h2>
        <p style="color: #475569;">Hola ${params.inquilinoNombre},</p>
        <p style="color: #475569;">El propietario ha aceptado tu solicitud para <strong>${params.viviendaTitulo}</strong>.</p>
        <p style="color: #475569;">El contrato se está generando. Una vez que el propietario lo firme, podrás revisarlo y firmarlo tú también.</p>
        <div style="margin-top: 24px; padding: 16px; background: #ecfdf5; border-radius: 12px;">
          <p style="margin: 0; font-size: 14px; color: #065f46;">Te notificaremos cuando el contrato esté listo para tu firma.</p>
        </div>
      </div>
    `,
  });
}

export async function enviarEmailSolicitudRechazada(params: {
  inquilinoEmail: string;
  inquilinoNombre: string;
  viviendaTitulo: string;
  motivoRechazo: string;
}) {
  await enviarEmail({
    to: params.inquilinoEmail,
    subject: `Tu solicitud para ${params.viviendaTitulo} no ha sido aceptada`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #1e293b;">Solicitud no aceptada</h2>
        <p style="color: #475569;">Hola ${params.inquilinoNombre},</p>
        <p style="color: #475569;">Lamentablemente, el propietario ha rechazado tu solicitud para <strong>${params.viviendaTitulo}</strong>.</p>
        <div style="margin-top: 16px; padding: 16px; background: #fff1f2; border-radius: 12px;">
          <p style="margin: 0; font-size: 14px; color: #9f1239;"><strong>Motivo:</strong> ${params.motivoRechazo}</p>
        </div>
        <p style="color: #475569; margin-top: 16px;">Puedes seguir buscando otras viviendas disponibles en la plataforma.</p>
      </div>
    `,
  });
}

export async function enviarEmailContratoListo(params: {
  inquilinoEmail: string;
  inquilinoNombre: string;
  viviendaTitulo: string;
}) {
  await enviarEmail({
    to: params.inquilinoEmail,
    subject: `Contrato listo para firmar - ${params.viviendaTitulo}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #1e293b;">Contrato listo para tu firma</h2>
        <p style="color: #475569;">Hola ${params.inquilinoNombre},</p>
        <p style="color: #475569;">El propietario ha firmado el contrato para <strong>${params.viviendaTitulo}</strong>.</p>
        <p style="color: #475569;">Accede a tu proceso de reserva para revisar y firmar el contrato digitalmente.</p>
        <div style="margin-top: 24px; padding: 16px; background: #eef2ff; border-radius: 12px;">
          <p style="margin: 0; font-size: 14px; color: #3730a3;">Una vez firmado, podrás proceder al pago.</p>
        </div>
      </div>
    `,
  });
}

export async function enviarEmailPagoRecibido(params: {
  propietarioEmail: string;
  propietarioNombre: string;
  inquilinoNombre: string;
  viviendaTitulo: string;
  importe: string;
}) {
  await enviarEmail({
    to: params.propietarioEmail,
    subject: `Pago recibido de ${params.inquilinoNombre} - ${params.viviendaTitulo}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #1e293b;">¡Pago confirmado!</h2>
        <p style="color: #475569;">Hola ${params.propietarioNombre},</p>
        <p style="color: #475569;"><strong>${params.inquilinoNombre}</strong> ha completado el pago de <strong>${params.importe}</strong> para <strong>${params.viviendaTitulo}</strong>.</p>
        <p style="color: #475569;">El pago queda retenido en escrow hasta que el inquilino confirme su llegada.</p>
        <div style="margin-top: 24px; padding: 16px; background: #ecfdf5; border-radius: 12px;">
          <p style="margin: 0; font-size: 14px; color: #065f46;">La reserva está confirmada.</p>
        </div>
      </div>
    `,
  });
}
