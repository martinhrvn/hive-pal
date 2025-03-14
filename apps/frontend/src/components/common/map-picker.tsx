import React, { useEffect, useState } from 'react';
import {
  TileLayer,
  Marker,
  MapContainer,
  Popup,
  useMapEvents,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { LatLngLiteral } from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type LocationMarkerProps = {
  onLocationSelect?: (location: {
    latitude: number;
    longitude: number;
  }) => void;
};

const LocationMarker: React.FC<LocationMarkerProps> = ({
  onLocationSelect,
}) => {
  const [position, setPosition] = useState<L.LatLng | null>(null);

  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
      onLocationSelect?.({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    },
    locationfound(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
      onLocationSelect?.({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    },
  });
  useEffect(() => {
    map.locate();
  }, [map]);

  return position === null ? null : (
    <Marker position={position}>
      <Popup>You are here</Popup>
    </Marker>
  );
};

type MapPickerProps = {
  onLocationSelect?: (location: {
    latitude: number;
    longitude: number;
  }) => void;
  initialLocation?: LatLngLiteral;
};

const MapPicker: React.FC<MapPickerProps> = ({
  onLocationSelect,
  initialLocation = { lat: 47, lng: 47 },
}) => {
  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Select Apiary Location</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-96 w-full border rounded-md overflow-hidden">
          <MapContainer
            className={'w-full h-full'}
            center={initialLocation}
            zoom={13}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <LocationMarker onLocationSelect={onLocationSelect} />
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default MapPicker;
