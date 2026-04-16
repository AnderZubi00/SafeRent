/**
 * Redimensiona y comprime una imagen antes de subirla a Storage.
 * Usa el Canvas API nativo del navegador — sin dependencias externas.
 *
 * @param file    Archivo de imagen original (cualquier formato soportado por el navegador)
 * @param maxPx   Lado máximo en píxeles. Si la imagen es más pequeña, no se escala.
 * @param quality Calidad JPEG [0–1]. 0.80 es buen balance tamaño/calidad para fotos de vivienda.
 * @returns       Nuevo File comprimido en JPEG. Si falla, devuelve el original intacto.
 */
export async function comprimirFoto(
  file: File,
  maxPx = 1280,
  quality = 0.8,
): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { naturalWidth: w, naturalHeight: h } = img;

      if (w > maxPx || h > maxPx) {
        if (w >= h) {
          h = Math.round((h * maxPx) / w);
          w = maxPx;
        } else {
          w = Math.round((w * maxPx) / h);
          h = maxPx;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }

      ctx.drawImage(img, 0, 0, w, h);

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
          resolve(new File([blob], name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // fallback: subir original sin comprimir
    };

    img.src = objectUrl;
  });
}
