const userRepository = require("../repositories/userRepository");
const endpointRepository = require("../repositories/endpointRepository");
const logRepository = require("../repositories/logRepository");

class MetricsService {
  async dashboard() {
    const usersTotal = await userRepository.total();
    const roleCounts = await userRepository.countByRole();
    const endpoints = await endpointRepository.findAll();
    const logs = await logRepository.summary();
    const recentLogs = await logRepository.recent(10);

    const roleMap = { admin: 0, user: 0, inactive: 0 };
    for (const r of roleCounts) roleMap[r.role] = Number(r.c);

    return {
      summary: {
        usersTotal,
        usersActive: roleMap.admin + roleMap.user,
        usersAdmin: roleMap.admin,
        usersInactive: roleMap.inactive,
        endpoints: endpoints.length,
        logsTotal: logs.total,
        logsLast24h: logs.last24h,
        avgLatencyMs: logs.avgLatencyMs,
      },
      logsByStatus: logs.byStatus,
      logsByMethod: logs.byMethod,
      recentLogs: recentLogs.map((l) => ({
        id: l.id, method: l.method, path: l.path, status_code: l.status_code,
        latency_ms: l.latency_ms, source: l.source, created_at: l.created_at,
      })),
    };
  }
}

module.exports = new MetricsService();
