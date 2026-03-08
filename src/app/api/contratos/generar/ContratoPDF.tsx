import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 11,
    fontFamily: "Helvetica",
    lineHeight: 1.6,
    color: "#1e293b",
  },
  header: {
    marginBottom: 30,
    textAlign: "center",
    borderBottom: "2px solid #4f46e5",
    paddingBottom: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#64748b",
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#4f46e5",
    marginTop: 20,
    marginBottom: 8,
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: 140,
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: "#475569",
  },
  value: {
    flex: 1,
    fontSize: 10,
  },
  paragraph: {
    marginBottom: 10,
    textAlign: "justify",
  },
  clauseTitle: {
    fontFamily: "Helvetica-Bold",
    marginTop: 12,
    marginBottom: 4,
  },
  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 50,
    paddingTop: 20,
    borderTop: "1px solid #e2e8f0",
  },
  signatureBlock: {
    width: "45%",
    textAlign: "center",
  },
  signatureLine: {
    borderBottom: "1px solid #94a3b8",
    marginTop: 50,
    marginBottom: 8,
  },
  signatureLabel: {
    fontSize: 9,
    color: "#64748b",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: "center",
    fontSize: 8,
    color: "#94a3b8",
    borderTop: "1px solid #e2e8f0",
    paddingTop: 8,
  },
});

interface DatosContrato {
  vivienda: {
    titulo: string;
    direccion: string;
    ciudad: string;
    numRegistro: string;
    precioMes: number;
    fianza: number;
  };
  propietario: {
    nombre: string;
    email: string;
    dni: string;
  };
  inquilino: {
    nombre: string;
    email: string;
    dni: string;
  };
  fechaInicio: string;
  fechaFin: string;
  motivo: string;
  fechaGeneracion: string;
}

export function ContratoPDF({ datos }: { datos: DatosContrato }) {
  const meses = Math.max(
    1,
    Math.round(
      (new Date(datos.fechaFin).getTime() -
        new Date(datos.fechaInicio).getTime()) /
        (1000 * 60 * 60 * 24 * 30)
    )
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>
            CONTRATO DE ARRENDAMIENTO DE VIVIENDA TEMPORAL
          </Text>
          <Text style={styles.subtitle}>
            Generado por SafeRent · {datos.fechaGeneracion}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>PARTES INTERVINIENTES</Text>

        <Text style={{ ...styles.clauseTitle, fontSize: 11 }}>
          ARRENDADOR (Propietario)
        </Text>
        <View style={styles.row}>
          <Text style={styles.label}>Nombre completo:</Text>
          <Text style={styles.value}>{datos.propietario.nombre}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>DNI/NIE:</Text>
          <Text style={styles.value}>{datos.propietario.dni}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{datos.propietario.email}</Text>
        </View>

        <Text style={{ ...styles.clauseTitle, fontSize: 11 }}>
          ARRENDATARIO (Inquilino)
        </Text>
        <View style={styles.row}>
          <Text style={styles.label}>Nombre completo:</Text>
          <Text style={styles.value}>{datos.inquilino.nombre}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>DNI/NIE:</Text>
          <Text style={styles.value}>{datos.inquilino.dni}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{datos.inquilino.email}</Text>
        </View>

        <Text style={styles.sectionTitle}>OBJETO DEL CONTRATO</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Vivienda:</Text>
          <Text style={styles.value}>{datos.vivienda.titulo}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Direccion:</Text>
          <Text style={styles.value}>
            {datos.vivienda.direccion}, {datos.vivienda.ciudad}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>N. Registro:</Text>
          <Text style={styles.value}>{datos.vivienda.numRegistro}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Motivo de estancia:</Text>
          <Text style={styles.value}>{datos.motivo}</Text>
        </View>

        <Text style={styles.sectionTitle}>CONDICIONES ECONOMICAS</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Renta mensual:</Text>
          <Text style={styles.value}>
            {datos.vivienda.precioMes.toLocaleString("es-ES")} EUR
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Fianza:</Text>
          <Text style={styles.value}>
            {datos.vivienda.fianza.toLocaleString("es-ES")} EUR
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Duracion:</Text>
          <Text style={styles.value}>
            {meses} meses (del{" "}
            {new Date(datos.fechaInicio).toLocaleDateString("es-ES")} al{" "}
            {new Date(datos.fechaFin).toLocaleDateString("es-ES")})
          </Text>
        </View>

        <Text style={styles.sectionTitle}>CLAUSULAS</Text>

        <Text style={styles.clauseTitle}>PRIMERA. Objeto</Text>
        <Text style={styles.paragraph}>
          El arrendador cede al arrendatario el uso temporal de la vivienda
          descrita, destinada exclusivamente a satisfacer la necesidad de
          alojamiento temporal del arrendatario por motivo de:{" "}
          {datos.motivo.toLowerCase()}.
        </Text>

        <Text style={styles.clauseTitle}>SEGUNDA. Duracion</Text>
        <Text style={styles.paragraph}>
          El presente contrato tendra una duracion de {meses} meses, desde el{" "}
          {new Date(datos.fechaInicio).toLocaleDateString("es-ES")} hasta el{" "}
          {new Date(datos.fechaFin).toLocaleDateString("es-ES")}, sin
          posibilidad de prorroga tacita al tratarse de un arrendamiento de uso
          distinto de vivienda habitual.
        </Text>

        <Text style={styles.clauseTitle}>TERCERA. Renta y fianza</Text>
        <Text style={styles.paragraph}>
          La renta mensual se fija en{" "}
          {datos.vivienda.precioMes.toLocaleString("es-ES")} EUR, pagaderos
          dentro de los primeros cinco dias de cada mes. Se constituye una fianza
          de {datos.vivienda.fianza.toLocaleString("es-ES")} EUR que sera
          devuelta al finalizar el contrato, previa verificacion del estado de la
          vivienda.
        </Text>

        <Text style={styles.clauseTitle}>CUARTA. Pago seguro</Text>
        <Text style={styles.paragraph}>
          Los pagos se realizan a traves de la plataforma SafeRent mediante
          sistema de escrow. El importe queda retenido hasta la confirmacion de
          entrada del inquilino en la vivienda.
        </Text>

        <View style={styles.signatureSection}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>
              EL ARRENDADOR (Propietario)
            </Text>
            <Text style={{ fontSize: 9, marginTop: 2 }}>
              {datos.propietario.nombre}
            </Text>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>
              EL ARRENDATARIO (Inquilino)
            </Text>
            <Text style={{ fontSize: 9, marginTop: 2 }}>
              {datos.inquilino.nombre}
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Documento generado digitalmente por SafeRent · Plataforma de alquiler
          temporal seguro · Este contrato tiene validez legal conforme a la Ley
          de Arrendamientos Urbanos.
        </Text>
      </Page>
    </Document>
  );
}
