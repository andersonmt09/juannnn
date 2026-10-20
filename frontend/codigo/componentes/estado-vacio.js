// Mensaje para listas vacías.
import { el } from "../utilidades/dom.js";

export function emptyState(title, text) {
  return el("div", { class: "empty" }, [el("h4", {}, [title]), el("p", {}, [text])]);
}
