export interface AddressValidationResult {
  valid: boolean;
  formattedAddress?: string;
  lat?: number;
  lng?: number;
}

/**
 * Validates an address using the free Nominatim (OpenStreetMap) geocoding API.
 * Rate limit: max 1 request/second. Non-blocking — used for informational validation only.
 */
export async function validateAddress(
  direccion: string,
  ciudad: string,
  provincia: string,
): Promise<AddressValidationResult> {
  if (!direccion.trim() || !ciudad.trim()) {
    return { valid: false };
  }

  const query = `${direccion}, ${ciudad}, ${provincia}, España`;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
        q: query,
        format: "json",
        limit: "1",
        countrycodes: "es",
      })}`,
      {
        headers: {
          "User-Agent": "SafeRent/1.0 (contact@saferent.es)",
        },
      },
    );

    if (!res.ok) return { valid: false };

    const data = await res.json();

    if (!data || data.length === 0) {
      return { valid: false };
    }

    const result = data[0];
    return {
      valid: true,
      formattedAddress: result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    };
  } catch {
    return { valid: false };
  }
}
