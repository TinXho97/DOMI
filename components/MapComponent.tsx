
import React, { useEffect, useRef } from 'react';
import { Location } from '../types';

declare const L: any;

interface MapComponentProps {
  center: Location;
  onLocationChange?: (loc: Location) => void;
  interactive?: boolean;
}

const MapComponent: React.FC<MapComponentProps> = ({ 
  center, 
  onLocationChange, 
  interactive = true 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const mainMarker = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    leafletMap.current = L.map(mapRef.current, { zoomControl: false, fadeAnimation: true }).setView([center.lat, center.lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(leafletMap.current);

    const userIcon = L.divIcon({
      html: '<div class="bg-blue-600 w-5 h-5 rounded-full border-4 border-white shadow-xl animate-pulse"></div>',
      className: '', iconSize: [20, 20]
    });

    mainMarker.current = L.marker([center.lat, center.lng], { icon: userIcon }).addTo(leafletMap.current);

    if (interactive) {
      leafletMap.current.on('click', (e: any) => {
        const newLoc = { lat: e.latlng.lat, lng: e.latlng.lng };
        mainMarker.current.setLatLng([newLoc.lat, newLoc.lng]);
        onLocationChange?.(newLoc);
      });
    }

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (leafletMap.current && center) {
      leafletMap.current.flyTo([center.lat, center.lng], leafletMap.current.getZoom(), {
        duration: 1.5
      });
      mainMarker.current.setLatLng([center.lat, center.lng]);
    }
  }, [center]);

  return (
    <div ref={mapRef} className="w-full h-full rounded-[2rem] overflow-hidden shadow-inner border border-slate-100" />
  );
};

export default MapComponent;
