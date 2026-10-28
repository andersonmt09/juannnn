// uso: npm run pruebas:carga (con el servidor encendido)
const BASE_URL = process.env.BASE_URL || "http://localhost:4000";
const TOTAL = 200;
const CONCURRENCY = 20;
const LIMIT_P95_MS = 500;

const times = [];
let failures = 0;
let sent = 0;

async function worker() {
  while (sent < TOTAL) {
    sent++;
    const startedAt = performance.now();
    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      await response.arrayBuffer();
      if (!response.ok) failures++;
    } catch {
      failures++;
    }
    times.push(performance.now() - startedAt);
  }
}

async function main() {
  const startedAt = performance.now();
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  const totalMs = performance.now() - startedAt;

  times.sort((a, b) => a - b);
  const avg = times.reduce((sum, t) => sum + t, 0) / times.length;
  const p95 = times[Math.ceil(times.length * 0.95) - 1];

  console.log(`Peticiones: ${TOTAL} (concurrencia ${CONCURRENCY}) en ${totalMs.toFixed(0)} ms`);
  console.log(`Fallidas: ${failures}`);
  console.log(`Promedio: ${avg.toFixed(1)} ms`);
  console.log(`p95: ${p95.toFixed(1)} ms (límite ${LIMIT_P95_MS} ms)`);
  process.exit(failures === 0 && p95 <= LIMIT_P95_MS ? 0 : 1);
}

main();
