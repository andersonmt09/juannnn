// Punto de entrada del frontend.
import { session } from "./store/session.store.js";
import { startRouter } from "./router/router.js";

document.documentElement.dataset.theme = session.getTheme();
startRouter();
