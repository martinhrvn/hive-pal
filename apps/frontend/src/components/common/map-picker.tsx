import React, { useEffect, useState } from 'react';
import {
  TileLayer,
  Marker,
  MapContainer,
  Popup,
  useMapEvents,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { LatLngLiteral, Icon } from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Fix for default marker icon issue with bundlers
const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = defaultIcon;

type LocationMarkerProps = {
  onLocationSelect?: (location: {
    latitude: number;
    longitude: number;
  }) => void;
  initialPosition?: L.LatLng | null;
  readOnly?: boolean;
};

const LocationMarker: React.FC<LocationMarkerProps> = ({
  onLocationSelect,
  initialPosition,
  readOnly = false,
}) => {
  const [position, setPosition] = useState<L.LatLng | null>(initialPosition || null);

  const map = useMapEvents({
    click(e) {
      if (!readOnly) {
        setPosition(e.latlng);
        map.flyTo(e.latlng, map.getZoom());
        onLocationSelect?.({ latitude: e.latlng.lat, longitude: e.latlng.lng });
      }
    },
    locationfound(e) {
      if (!readOnly && !initialPosition) {
        setPosition(e.latlng);
        map.flyTo(e.latlng, 7);
        onLocationSelect?.({ latitude: e.latlng.lat, longitude: e.latlng.lng });
      }
    },
  });
  
  useEffect(() => {
    if (!readOnly && !initialPosition) {
      map.locate();
    }
  }, [map, readOnly, initialPosition]);

  return position === null ? null : (
    <Marker position={position} icon={defaultIcon}>
      <Popup>{readOnly ? 'Apiary Location' : 'Selected Location'}</Popup>
    </Marker>
  );
};

type MapPickerProps = {
  onLocationSelect?: (location: {
    latitude: number;
    longitude: number;
  }) => void;
  initialLocation?: LatLngLiteral;
  readOnly?: boolean;
};

const MapPicker: React.FC<MapPickerProps> = ({
  onLocationSelect,
  initialLocation = { lat: 50.4133645, lng: 10.8357111 },
  readOnly = false,
}) => {
  const hasInitialLocation = initialLocation.lat !== 50.4133645 || initialLocation.lng !== 10.8357111;
  const initialPosition = hasInitialLocation ? new L.LatLng(initialLocation.lat, initialLocation.lng) : null;
  
  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>{readOnly ? 'Apiary Location' : 'Select Apiary Location'}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-96 w-full border rounded-md overflow-hidden">
          <MapContainer
            className={'w-full h-full'}
            center={initialLocation}
            zoom={hasInitialLocation ? 10 : 4}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <LocationMarker 
              onLocationSelect={onLocationSelect} 
              initialPosition={initialPosition}
              readOnly={readOnly}
            />
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default MapPicker;
