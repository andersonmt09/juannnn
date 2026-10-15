/** Exportación a CSV (RF-15). */
import { toast } from "./toast.js";

/**
 * @param {object[]} rows      filas a exportar
 * @param {string}   filename  nombre del archivo
 * @param {[string, string][]} columns  pares [campo, encabezado]
 */
export function exportToCsv(rows, filename, columns) {
  const escape = (value) => {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const header = columns.map(([, title]) => title).join(",");
  const body = rows.map((row) => columns.map(([field]) => escape(row[field])).join(",")).join("\n");

  const blob = new Blob([`﻿${header}\n${body}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  toast.success(`Exportado: ${filename}`);
}
