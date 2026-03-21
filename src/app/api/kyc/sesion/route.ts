import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    // Buscar sesión PENDIENTE existente que no haya expirado
    const { data: existente } = await supabase
      .from("kyc_sesiones")
      .select("id, token, expira_en")
      .eq("usuario_id", user.id)
      .eq("estado", "PENDIENTE")
      .gt("expira_en", new Date().toISOString())
      .order("creado_en", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existente) {
      return NextResponse.json({
        id: existente.id,
        token: existente.token,
        expira_en: existente.expira_en,
      });
    }

    // Crear nueva sesión (token generado por DB default)
    const { data: nueva, error: insertError } = await supabase
      .from("kyc_sesiones")
      .insert({
        usuario_id: user.id,
        estado: "PENDIENTE",
      })
      .select("id, token, expira_en")
      .single();

    if (insertError) {
      console.error("[KYC Sesión] Error al crear sesión:", insertError);
      return NextResponse.json(
        { error: "Error al crear la sesión" },
        { status: 500 }
      );
    }

    return NextResponse.json(nueva);
  } catch (error) {
    console.error("[KYC Sesión] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
