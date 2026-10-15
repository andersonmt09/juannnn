// Punto de entrada del cliente.
import { session } from "./estado/sesion.js";
import { startRouter } from "./enrutador/enrutador.js";

document.documentElement.dataset.theme = session.getTheme();
startRouter();
