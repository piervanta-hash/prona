"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { TILE_ZOOM, CITY_CENTERS, cityTileBounds } from "@/lib/geo";

export type MapPin = {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  count?: number; // se presente, disegna un cerchio numerato (aggregato di zona) invece di un segnaposto
  href?: string;
};

function pinIcon() {
  return L.divIcon({
    className: "",
    html: `<svg viewBox="0 0 22 26" width="22" height="26" style="overflow:visible"><path d="M11 25 C11 25 20 15 20 9.5 C20 4.3 16 0 11 0 C6 0 2 4.3 2 9.5 C2 15 11 25 11 25 Z" fill="#C8102E" stroke="#ffffff" stroke-width="1.5"/><circle cx="11" cy="9.5" r="3.6" fill="#ffffff"/></svg>`,
    iconSize: [22, 26],
    iconAnchor: [11, 25],
    popupAnchor: [0, -26],
  });
}

function clusterIcon(count: number) {
  const r = Math.min(30, 14 + count * 2.2);
  return L.divIcon({
    className: "",
    html: `<div style="width:${r * 2}px;height:${r * 2}px;border-radius:9999px;background:rgba(14,42,51,0.85);border:2px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:${Math.max(11, r * 0.55)}px">${count}</div>`,
    iconSize: [r * 2, r * 2],
    iconAnchor: [r, r],
    popupAnchor: [0, -r],
  });
}

/**
 * Mappa realmente navigabile (trascinabile, con segnaposto cliccabili),
 * costruita su Leaflet ma servita interamente in locale: le tile OSM sono
 * gia' salvate in public/tiles (fetch-tiles.mjs, una tantum), Leaflet stesso
 * e' incluso nel bundle. A runtime non parte nessuna richiesta di rete.
 * Lo zoom resta fisso al livello scaricato (15): oltre non ci sono tile.
 */
export default function PronaMap({
  municipality,
  pins,
  size = 420,
}: {
  municipality: string;
  pins: MapPin[];
  size?: number;
}) {
  const city = CITY_CENTERS[municipality] ?? CITY_CENTERS["Tiranë"];
  const bounds = useMemo(() => {
    const b = cityTileBounds(city.lat, city.lng);
    return L.latLngBounds([b.south, b.west], [b.north, b.east]);
  }, [city.lat, city.lng]);

  return (
    <div className="relative border border-[#dbe4e7]" style={{ width: size, height: size }}>
      <MapContainer
        center={[city.lat, city.lng]}
        zoom={TILE_ZOOM}
        minZoom={TILE_ZOOM}
        maxZoom={TILE_ZOOM}
        zoomControl={false}
        attributionControl={false}
        maxBounds={bounds}
        maxBoundsViscosity={1}
        scrollWheelZoom={false}
        style={{ width: "100%", height: "100%", background: "#e7ecee" }}
      >
        <TileLayer
          url={`/tiles/${city.key}/${TILE_ZOOM}/{x}_{y}.png`}
          tileSize={256}
          className="grayscale contrast-[1.08] brightness-[0.97]"
        />
        {pins.map((pin) => {
          const icon = pin.count !== undefined ? clusterIcon(pin.count) : pinIcon();
          return (
            <Marker key={pin.id} position={[pin.lat, pin.lng]} icon={icon}>
              {pin.href ? (
                <Popup>
                  <a href={pin.href} className="font-semibold text-petrol-800 hover:underline">
                    {pin.label}
                  </a>
                </Popup>
              ) : (
                pin.label && <Tooltip direction="top">{pin.label}</Tooltip>
              )}
            </Marker>
          );
        })}
      </MapContainer>
      <div className="absolute bottom-0 right-0 bg-white/85 text-[0.62rem] text-slate-600 px-1.5 py-0.5 z-[1000] pointer-events-none">
        © OpenStreetMap contributors
      </div>
    </div>
  );
}
