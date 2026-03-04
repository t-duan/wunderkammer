import { MapContainer, TileLayer } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import type { POIBase } from '../types';
import { pois } from '../data/pois';
import POIMarkerComp from './POIMarker';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  activePOI: POIBase | null;
  onPOIClick: (poi: POIBase) => void;
}

const GOTHA_CENTER: [number, number] = [50.9474, 10.7048];

export default function MapView({ activePOI, onPOIClick }: MapViewProps) {
  const { i18n } = useTranslation();

  return (
    <MapContainer
      center={GOTHA_CENTER}
      zoom={15}
      style={{ width: '100%', height: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pois.map((poi) => (
        <POIMarkerComp
          key={poi.id}
          poi={poi}
          active={activePOI?.id === poi.id}
          lang={i18n.language}
          onClick={onPOIClick}
        />
      ))}
    </MapContainer>
  );
}
