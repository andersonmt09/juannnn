// Punto de entrada del frontend: aplica el tema guardado e inicia el enrutador.
import { applySavedTheme } from "./controladores/sesion.js";
import { startRouter } from "./enrutador/enrutador.js";

applySavedTheme();
startRouter();
