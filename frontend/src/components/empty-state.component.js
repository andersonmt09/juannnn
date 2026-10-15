/** COMPONENTE: Mensaje cuando una lista no tiene datos. */
import { el } from "../utils/dom.js";

export function emptyState(title, text) {
  return el("div", { class: "empty" }, [el("h4", {}, [title]), el("p", {}, [text])]);
}
