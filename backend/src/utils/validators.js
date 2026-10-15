/** Validaciones reutilizables por los DTOs. */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const isValidEmail = (value) => typeof value === "string" && EMAIL_REGEX.test(value);
const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const isValidHttpMethod = (value) => HTTP_METHODS.includes(String(value || "").toUpperCase());
const isPositiveInteger = (value) => Number.isInteger(Number(value)) && Number(value) > 0;

module.exports = { isValidEmail, normalizeEmail, isValidHttpMethod, isPositiveInteger, HTTP_METHODS };
