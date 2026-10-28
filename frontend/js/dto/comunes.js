export const clean = (value) => (typeof value === "string" ? value.trim() : value);

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
