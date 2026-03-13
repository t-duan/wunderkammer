import { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { POIBase } from '../types';
import { colors } from '../theme';

interface POIMarkerProps {
  poi: POIBase;
  active?: boolean;
  lang: string;
  onClick: (poi: POIBase) => void;
  markerImage: string | null;
}

function createIcon(imageUrl: string | null, active: boolean) {
  const size = active ? 44 : 36;
  const half = size / 2;
  const borderColor = active ? colors.gerberarot : '#fff';
  const borderWidth = active ? 3 : 2;

  const inner = imageUrl
    ? `<img src="${imageUrl}" style="width:100%;height:100%;object-fit:cover;display:block;" />`
    : `<div style="width:100%;height:100%;background:${active ? colors.gerberarot : colors.trollingerblau};"></div>`;

  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;
      border-radius:50%;
      border:${borderWidth}px solid ${borderColor};
      box-shadow:0 2px 8px rgba(0,0,0,0.4);
      overflow:hidden;
      cursor:pointer;
    ">${inner}</div>`,
    iconSize: [size, size],
    iconAnchor: [half, half],
  });
}

export default function POIMarker({ poi, active, lang, onClick, markerImage }: POIMarkerProps) {
  const title = lang === 'en' ? poi.title_en : poi.title_de;
  const icon = useMemo(() => createIcon(markerImage, !!active), [markerImage, active]);

  return (
    <Marker
      position={[poi.lat, poi.lng]}
      icon={icon}
      eventHandlers={{ click: () => onClick(poi) }}
    >
      <Popup>
        <strong>{title}</strong>
      </Popup>
    </Marker>
  );
}
