// Validaciones y normalizaciones reutilizables por los DTO.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const isValidEmail = (value) => typeof value === "string" && EMAIL_REGEX.test(value);
const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const isValidHttpMethod = (value) => HTTP_METHODS.includes(String(value || "").toUpperCase());
const isPositiveInteger = (value) => Number.isInteger(Number(value)) && Number(value) > 0;

// "/api/users/15?x=1" -> "/api/users/:id". Así se agrupan las peticiones por ruta.
const toRoutePattern = (url) => String(url || "").split("?")[0].replace(/\/\d+(?=\/|$)/g, "/:id");

module.exports = { isValidEmail, normalizeEmail, isValidHttpMethod, isPositiveInteger, toRoutePattern, HTTP_METHODS };
