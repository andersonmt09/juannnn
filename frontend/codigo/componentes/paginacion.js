// Controles de paginación: "Anterior · Página X de Y · Siguiente".
import { el } from "../utilidades/dom.js";

/**
 * @param {{ page: number, totalPages: number, total: number }} meta
 * @param {(page: number) => void} onChange
 */
export function pagination({ page, totalPages, total }, onChange) {
  if (totalPages <= 1) return el("div", { class: "pagination" }, [`${total} en total`]);

  return el("div", { class: "pagination" }, [
    el("button", { class: "btn btn-sm", disabled: page <= 1, onclick: () => onChange(page - 1) }, ["Anterior"]),
    el("span", {}, [`Página ${page} de ${totalPages} · ${total} en total`]),
    el("button", { class: "btn btn-sm", disabled: page >= totalPages, onclick: () => onChange(page + 1) }, ["Siguiente"]),
  ]);
}
