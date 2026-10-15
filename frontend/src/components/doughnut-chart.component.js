// Gráfica de dona con Chart.js.
import { el } from "../utils/dom.js";

const PALETTE = ["#3dd6c6", "#4ade80", "#f4b942", "#ff6b7a", "#6ae3d6", "#9aa0c3"];

export function doughnutChart(title, items) {
  const canvas = el("canvas", { height: "200" });
  const panel = el("div", { class: "panel" }, [el("h3", {}, [title]), canvas]);

  if (!items.length) {
    canvas.replaceWith(el("p", { class: "muted small" }, ["Sin datos todavía."]));
  } else if (window.Chart) {
    new window.Chart(canvas.getContext("2d"), {
      type: "doughnut",
      data: {
        labels: items.map((i) => i.label),
        datasets: [{ data: items.map((i) => i.value), backgroundColor: PALETTE, borderWidth: 0 }],
      },
      options: {
        cutout: "68%",
        plugins: { legend: { position: "bottom", labels: { color: "#9aa0c3", boxWidth: 12, font: { size: 11 } } } },
      },
    });
  }
  return panel;
}
