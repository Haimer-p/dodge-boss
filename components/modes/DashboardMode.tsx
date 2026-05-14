"use client";

import { useState, useMemo } from "react";

const METRICS = [
  { id: "requests", label: "Requests/min", unit: "", base: 1240 },
  { id: "latency", label: "P99 Latency", unit: "ms", base: 128 },
  { id: "errors", label: "Error Rate", unit: "%", base: 0.8 },
  { id: "uptime", label: "Uptime", unit: "%", base: 99.97 },
];

const TIME_RANGES = ["1h", "6h", "24h", "7d"] as const;

function randomize(base: number, range: string) {
  const factor = range === "1h" ? 0.05 : range === "6h" ? 0.1 : range === "24h" ? 0.15 : 0.25;
  return base * (1 + (Math.random() - 0.5) * factor * 2);
}

export default function DashboardMode() {
  const [timeRange, setTimeRange] = useState<(typeof TIME_RANGES)[number]>("24h");
  const [selectedMetric, setSelectedMetric] = useState("requests");
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const values = useMemo(() => {
    return METRICS.map((m) => ({
      ...m,
      value: m.id === "errors"
        ? randomize(m.base, timeRange).toFixed(2)
        : m.id === "uptime"
        ? randomize(m.base, timeRange).toFixed(2)
        : Math.round(randomize(m.base, timeRange)).toLocaleString(),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, refreshKey]);

  const chartBars = useMemo(() => {
    return Array.from({ length: 12 }, () => 20 + Math.random() * 80);
  }, [timeRange, refreshKey, selectedMetric]);

  const selected = values.find((v) => v.id === selectedMetric);

  return (
    <div className="flex-1 flex flex-col bg-gray-950 rounded-lg overflow-hidden border border-gray-800 shadow-sm">
      <div className="bg-gray-900/90 border-b border-gray-800 px-4 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-orange-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
          </svg>
          <span className="text-sm font-semibold text-gray-200">auth-service — Production Metrics</span>
        </div>
        <div className="flex items-center gap-2">
          {TIME_RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                timeRange === r ? "bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/40" : "text-gray-500 hover:bg-gray-800"
              }`}
            >
              {r}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto thin-scrollbar p-4 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {values.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedMetric(m.id)}
              className={`text-left p-4 rounded-xl border transition-all ${
                selectedMetric === m.id
                  ? "bg-orange-500/10 border-orange-500/40 ring-1 ring-orange-500/30"
                  : "bg-gray-900 border-gray-800 hover:border-gray-700"
              }`}
            >
              <p className="text-xs text-gray-500 mb-1">{m.label}</p>
              <p className="text-2xl font-bold text-gray-100">
                {m.value}
                {m.unit && <span className="text-sm text-gray-500 ml-1">{m.unit}</span>}
              </p>
            </button>
          ))}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-300">
              {selected?.label} — Last {timeRange}
            </h3>
            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                checked={alertsEnabled}
                onChange={(e) => setAlertsEnabled(e.target.checked)}
                className="rounded accent-orange-500"
              />
              Alerts enabled
            </label>
          </div>
          <div className="flex items-end gap-1.5 h-32">
            {chartBars.map((h, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRefreshKey((k) => k + 1)}
                className="flex-1 bg-orange-500/60 hover:bg-orange-500 rounded-t transition-all"
                style={{ height: `${h}%` }}
                title={`Point ${i + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Recent Events</h3>
            <ul className="space-y-2 text-xs">
              {[
                "Deployment prod-v1.2.3 completed",
                "Auto-scaling: 3 → 5 instances",
                "Rate limit triggered: 12 events",
                "Health check: all endpoints OK",
              ].map((ev, i) => (
                <li key={i} className="flex items-center gap-2 text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                  {ev}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Service Status</h3>
            <div className="space-y-2">
              {["auth-api", "token-service", "user-service", "redis-cluster"].map((svc) => (
                <div key={svc} className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">{svc}</span>
                  <span className="text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Healthy
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
