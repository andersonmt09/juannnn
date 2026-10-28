// DTO de petición (req) comunes del frontend: piezas que comparten los DTO de cada módulo.
// Tienen los mismos nombres que los de backend/dto. No validan: valida el backend.

// Texto sin espacios al inicio y al final (si no es texto, lo deja igual).
export const clean = (value) => (typeof value === "string" ? value.trim() : value);

// Base de las peticiones GET: toQuery() devuelve "?a=1&b=2" sin los campos vacíos.
export class QueryRequestDto {
  toQuery() {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(this)) {
      if (value !== undefined && value !== null && value !== "") query.set(key, value);
    }
    const text = query.toString();
    return text ? `?${text}` : "";
  }
}
