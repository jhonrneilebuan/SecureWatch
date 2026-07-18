import { useEffect, useMemo, useState } from 'react';
import { geoContains, geoMercator } from 'd3-geo';
import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import countriesTopo from 'world-atlas/countries-110m.json';
import { api } from '../api/client';
import { DashboardSummary, LiveAttackFeedItem } from '../types';

type TopCountry = DashboardSummary['topCountries'][number];

interface WorldThreatMapProps {
  topCountries: TopCountry[];
}

interface Marker {
  id: string;
  label: string;
  count: number;
  latitude: number;
  longitude: number;
  attackType: 'attack' | 'infection' | 'spam';
}

const width = 1000;
const height = 440;
const target = { latitude: 14.5995, longitude: 120.9842, label: 'SecureWatch SOC' };
const projection = geoMercator().scale(152).translate([width / 2, height / 1.62]);
const countryNameFallback: Record<string, string> = {
  US: 'United States',
  DE: 'Germany',
  CA: 'Canada',
  BR: 'Brazil',
  GB: 'United Kingdom',
  FR: 'France',
  RU: 'Russia',
  CN: 'China',
  JP: 'Japan',
  IN: 'India',
  SG: 'Singapore',
  AU: 'Australia',
  NL: 'Netherlands',
};
const fallbackCountryCoordinates: Record<string, { latitude: number; longitude: number }> = {
  US: { latitude: 39.8283, longitude: -98.5795 },
  DE: { latitude: 51.1657, longitude: 10.4515 },
  CA: { latitude: 56.1304, longitude: -106.3468 },
  BR: { latitude: -14.235, longitude: -51.9253 },
  GB: { latitude: 55.3781, longitude: -3.436 },
  FR: { latitude: 46.2276, longitude: 2.2137 },
  RU: { latitude: 61.524, longitude: 105.3188 },
  CN: { latitude: 35.8617, longitude: 104.1954 },
  JP: { latitude: 36.2048, longitude: 138.2529 },
  IN: { latitude: 20.5937, longitude: 78.9629 },
  SG: { latitude: 1.3521, longitude: 103.8198 },
  AU: { latitude: -25.2744, longitude: 133.7751 },
  NL: { latitude: 52.1326, longitude: 5.2913 },
};

const topology = countriesTopo as unknown as Topology;
const land = feature(topology, topology.objects.countries as GeometryCollection);

function createLandDots() {
  const dots: { x: number; y: number }[] = [];

  for (let x = 20; x <= width - 20; x += 7) {
    for (let y = 24; y <= height - 24; y += 7) {
      const coordinates = projection.invert?.([x, y]);
      if (coordinates && geoContains(land, coordinates)) {
        dots.push({ x, y });
      }
    }
  }

  return dots;
}

function projectPoint(latitude: number, longitude: number) {
  const projected = projection([longitude, latitude]);
  return projected ? { x: projected[0], y: projected[1] } : null;
}

function arcPath(origin: Marker) {
  const start = projectPoint(origin.latitude, origin.longitude);
  const end = projectPoint(target.latitude, target.longitude);
  if (!start || !end) {
    return '';
  }

  const midX = (start.x + end.x) / 2;
  const midY = Math.min(start.y, end.y) - Math.max(42, Math.abs(start.x - end.x) * 0.18);
  return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
}

function countryLabel(code: string) {
  return countryNameFallback[code.toUpperCase()] ?? code;
}

function flagIcon(code: string) {
  const normalized = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) {
    return '[]';
  }

  return String.fromCodePoint(...normalized.split('').map((char) => 127397 + char.charCodeAt(0)));
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function WorldThreatMap({ topCountries }: WorldThreatMapProps) {
  const [feed, setFeed] = useState<LiveAttackFeedItem[]>([]);

  useEffect(() => {
    let active = true;

    const loadFeed = () => {
      api.get<LiveAttackFeedItem[]>('/dashboard/live-feed')
        .then(({ data }) => {
          if (active) {
            setFeed(data);
          }
        })
        .catch(() => {
          if (active) {
            setFeed([]);
          }
        });
    };

    loadFeed();
    const interval = window.setInterval(loadFeed, 15000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const landDots = useMemo(createLandDots, []);
  const markers = useMemo<Marker[]>(() => {
    const liveMarkers = feed
      .filter((item) => item.latitude != null && item.longitude != null)
      .map((item, index) => ({
        id: `${item.sourceIp}-${item.timestamp}`,
        label: countryLabel(item.sourceCountry),
        count: 1,
        latitude: item.latitude as number,
        longitude: item.longitude as number,
        attackType: index % 3 === 0 ? 'attack' as const : index % 3 === 1 ? 'infection' as const : 'spam' as const,
      }));

    if (liveMarkers.length > 0) {
      return liveMarkers.slice(0, 12);
    }

    return topCountries
      .map((item, index) => {
        const fallback = fallbackCountryCoordinates[item.name.toUpperCase()];
        const latitude = item.latitude ?? fallback?.latitude;
        const longitude = item.longitude ?? fallback?.longitude;
        if (latitude == null || longitude == null) {
          return null;
        }

        return {
          id: item.name,
          label: countryLabel(item.name),
          count: item.count,
          latitude,
          longitude,
          attackType: index % 3 === 0 ? 'attack' as const : index % 3 === 1 ? 'infection' as const : 'spam' as const,
        };
      })
      .filter((item): item is Marker => item !== null);
  }, [feed, topCountries]);

  const locations = topCountries.length > 0 ? topCountries : markers.map((marker) => ({ name: marker.label, count: marker.count }));
  const totalEvents = topCountries.reduce((sum, item) => sum + item.count, 0);
  const targetPoint = projectPoint(target.latitude, target.longitude);

  return (
    <section>
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-black shadow-2xl shadow-black/30">
        <div className="flex h-14 items-end justify-between border-b border-emerald-400/25 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-5 pb-3">
          <div className="flex items-end gap-3">
            <p className="text-2xl font-black leading-none tracking-tight text-white">SecureWatch</p>
            <div className="pb-0.5 text-[11px] font-black uppercase leading-[0.72rem] tracking-wide text-emerald-950/80">
              <p>Cyberthreat</p>
              <p>Real-Time Map</p>
            </div>
          </div>
          <span className="rounded border border-emerald-950/15 bg-emerald-950/15 px-2.5 py-1 text-[10px] font-black uppercase text-white">
            {totalEvents} events
          </span>
        </div>

        <div className="relative h-[30rem] overflow-hidden bg-black">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(8,119,242,.18),transparent_42%),linear-gradient(rgba(15,23,42,.3),rgba(0,0,0,.98))]" />
          <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" aria-label="World cyberthreat activity map">
            <defs>
              <filter id="threatGlow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="attackArc" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.18" />
                <stop offset="55%" stopColor="#ef4444" stopOpacity="0.78" />
                <stop offset="100%" stopColor="#fb923c" stopOpacity="0.5" />
              </linearGradient>
            </defs>

            <rect width={width} height={height} fill="transparent" />
            <g opacity="0.95">
              {landDots.map((dot) => (
                <circle key={`${dot.x}-${dot.y}`} cx={dot.x} cy={dot.y} r="1.45" fill="#94a3b8" opacity="0.52" />
              ))}
            </g>

            <g>
              {markers.map((marker, index) => (
                <path
                  key={`${marker.id}-arc`}
                  d={arcPath(marker)}
                  fill="none"
                  stroke="url(#attackArc)"
                  strokeLinecap="round"
                  strokeWidth={marker.attackType === 'attack' ? 2.8 : 1.8}
                  strokeDasharray="8 10"
                  filter="url(#threatGlow)"
                  style={{ animation: 'dashFlow 2.6s linear infinite', animationDelay: `${index * 0.35}s` }}
                />
              ))}
            </g>

            {targetPoint && (
              <g transform={`translate(${targetPoint.x} ${targetPoint.y})`} filter="url(#threatGlow)">
                <circle r="18" fill="#ef4444" opacity="0.16" />
                <circle r="8" fill="#ef4444" stroke="#fecaca" strokeWidth="1.6" />
                <text y="25" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="800">SOC</text>
              </g>
            )}

            {markers.map((marker) => {
              const point = projectPoint(marker.latitude, marker.longitude);
              if (!point) {
                return null;
              }

              const color = marker.attackType === 'attack' ? '#ef4444' : marker.attackType === 'infection' ? '#fb923c' : '#f8fafc';
              const radius = marker.attackType === 'spam' ? 3 : Math.min(14, 6 + marker.count * 1.6);
              return (
                <g key={`${marker.id}-marker`} transform={`translate(${point.x} ${point.y})`} filter="url(#threatGlow)">
                  <circle r={radius + 7} fill={color} opacity="0.12" />
                  <circle r={radius} fill={color} opacity="0.88" stroke="#020617" strokeWidth="2" />
                </g>
              );
            })}
          </svg>
        </div>

        <div className="grid border-t border-slate-800 bg-black md:grid-cols-[16rem_minmax(0,1fr)_16rem]">
          <div className="border-b border-slate-800 p-4 md:border-b-0 md:border-r">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">Legend</p>
              <span className="text-slate-600">v</span>
            </div>
            <div className="space-y-4 text-xs font-bold uppercase tracking-wider text-slate-300">
              <div className="flex items-center gap-3"><span className="h-5 w-5 rounded-full border border-red-500 bg-red-600/80 shadow shadow-red-500/40" /> Attacks</div>
              <div className="flex items-center gap-3"><span className="h-5 w-5 rounded-full border border-orange-300 bg-orange-500/75 shadow shadow-orange-500/40" /> Infections</div>
              <div className="flex items-center gap-3"><span className="h-2.5 w-2.5 rounded-full bg-slate-100" /> Spam</div>
            </div>
          </div>

          <div className="border-b border-slate-800 p-4 md:border-b-0 md:border-r">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">Live Attacks</p>
              <span className="text-slate-600">v</span>
            </div>
            <div className="max-h-44 overflow-auto">
              <table className="w-full min-w-[38rem] text-left text-[11px]">
                <thead className="sticky top-0 bg-black text-[10px] uppercase tracking-wider text-cyan-500">
                  <tr>
                    <th className="py-1.5">Time</th>
                    <th>Attack</th>
                    <th>Type</th>
                    <th>Source Country</th>
                    <th>Target Country</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {(feed.length ? feed : markers.slice(0, 8).map((marker, index) => ({
                    timestamp: new Date(Date.now() - index * 45_000).toISOString(),
                    attackType: marker.attackType === 'attack' ? 'Brute Force Attack' : marker.attackType === 'infection' ? 'Reputation Hit' : 'Auth Scan',
                    severity: 'Medium',
                    sourceIp: '',
                    sourceCountry: marker.label,
                    targetCountry: target.label,
                    latitude: marker.latitude,
                    longitude: marker.longitude,
                  }))).map((row, index) => (
                    <tr key={`${row.timestamp}-${row.sourceCountry}-${index}`} className={index % 2 === 0 ? 'bg-slate-950/80' : 'bg-slate-900/40'}>
                      <td className="py-1.5 font-mono text-slate-500">{formatTime(row.timestamp)}</td>
                      <td className="font-mono text-slate-300">{row.attackType}</td>
                      <td className="font-bold text-orange-400">{row.severity}</td>
                      <td className="text-slate-300">{countryLabel(row.sourceCountry)}</td>
                      <td className="text-slate-500">{row.targetCountry}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">Locations</p>
              <span className="text-slate-600">v</span>
            </div>
            <div className="max-h-44 space-y-2 overflow-auto pr-1">
              {locations.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="w-5 shrink-0 text-sm">{flagIcon(item.name)}</span>
                    <span className="truncate font-bold uppercase text-slate-300">{countryLabel(item.name)}</span>
                  </div>
                  <span className="text-slate-500">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
