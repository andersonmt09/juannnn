/**
 * Punto de entrada del frontend.
 * Aplica el tema guardado e inicia el enrutador.
 */
import { session } from "./services/session.service.js";
import { startRouter } from "./router/router.js";

document.documentElement.dataset.theme = session.getTheme();
startRouter();
