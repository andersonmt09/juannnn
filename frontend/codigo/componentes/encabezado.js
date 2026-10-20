// Encabezado de página con título, subtítulo y botones.
import { el } from "../utilidades/dom.js";

export function pageHeader(title, subtitle = "", actions = []) {
  return el("div", { class: "page-header row-between" }, [
    el("div", {}, [el("h2", {}, [title]), subtitle ? el("div", { class: "page-subtitle" }, [subtitle]) : null]),
    el("div", { class: "row" }, actions),
  ]);
}
