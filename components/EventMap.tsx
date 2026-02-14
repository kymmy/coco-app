"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapEvent {
  id: string;
  title: string;
  date: Date;
  location: string;
  latitude: number | null;
  longitude: number | null;
  category: string;
  attendees: { coming: string[]; maybe: string[]; cant: string[] };
}

function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export default function EventMap({ events }: { events: MapEvent[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const geoEvents = events.filter((e) => e.latitude && e.longitude);
    if (geoEvents.length === 0) return;

    const map = L.map(mapRef.current).setView(
      [geoEvents[0].latitude!, geoEvents[0].longitude!],
      12
    );
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const coralIcon = L.divIcon({
      className: "",
      html: `<div style="background:#FF6B6B;width:32px;height:32px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:14px;">📍</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    const bounds = L.latLngBounds([]);

    geoEvents.forEach((e) => {
      const latlng = L.latLng(e.latitude!, e.longitude!);
      bounds.extend(latlng);

      L.marker(latlng, { icon: coralIcon })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:Nunito,sans-serif;">
            <strong style="font-size:14px;">${e.title}</strong><br/>
            <span style="color:#6B6B6B;font-size:12px;">📅 ${formatDateShort(e.date)}</span><br/>
            <span style="color:#6B6B6B;font-size:12px;">👥 ${e.attendees.coming.length} participant${e.attendees.coming.length !== 1 ? "s" : ""}</span><br/>
            <a href="/events/${e.id}" style="color:#FF6B6B;font-weight:bold;font-size:12px;text-decoration:none;">Voir les détails →</a>
          </div>`
        );
    });

    if (geoEvents.length > 1) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [events]);

  const geoEvents = events.filter((e) => e.latitude && e.longitude);

  if (geoEvents.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center rounded-3xl bg-white shadow-md">
        <p className="text-charcoal-muted">
          Aucun événement avec coordonnées GPS.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl shadow-md">
      <div ref={mapRef} className="h-96 w-full" />
    </div>
  );
}
