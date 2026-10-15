// Ventana modal reutilizable.
import { el } from "../utilidades/dom.js";

/**
 * @param {string} title
 * @param {HTMLElement} body  contenido (normalmente un formulario)
 * @returns {{ element: HTMLElement, open: Function, close: Function, setTitle: Function }}
 */
export function createModal(title, body) {
  const heading = el("h3", {}, [title]);
  const element = el("div", { class: "modal hidden" }, [
    el("div", { class: "modal-backdrop", onclick: () => close() }),
    el("div", { class: "modal-card" }, [heading, body]),
  ]);

  const open = () => element.classList.remove("hidden");
  const close = () => element.classList.add("hidden");
  const setTitle = (text) => { heading.textContent = text; };

  return { element, open, close, setTitle };
}
