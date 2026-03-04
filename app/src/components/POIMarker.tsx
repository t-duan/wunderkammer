import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { POIBase } from '../types';
import { colors } from '../theme';

const markerIcon = L.divIcon({
  className: 'poi-marker',
  html: `<div style="
    width: 28px; height: 28px;
    background: ${colors.trollingerblau};
    border: 3px solid #fff;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const activeMarkerIcon = L.divIcon({
  className: 'poi-marker-active',
  html: `<div style="
    width: 36px; height: 36px;
    background: ${colors.gerberarot};
    border: 3px solid #fff;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

interface POIMarkerProps {
  poi: POIBase;
  active?: boolean;
  lang: string;
  onClick: (poi: POIBase) => void;
}

export default function POIMarker({ poi, active, lang, onClick }: POIMarkerProps) {
  const title = lang === 'en' ? poi.title_en : poi.title_de;

  return (
    <Marker
      position={[poi.lat, poi.lng]}
      icon={active ? activeMarkerIcon : markerIcon}
      eventHandlers={{ click: () => onClick(poi) }}
    >
      <Popup>
        <strong>{title}</strong>
      </Popup>
    </Marker>
  );
}
