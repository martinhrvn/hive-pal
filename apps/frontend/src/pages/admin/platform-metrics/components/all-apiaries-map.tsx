import React from 'react';
import { TileLayer, Marker, MapContainer, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { Icon } from 'leaflet';
import { useAdminApiariesMap } from '@/api/hooks/useAdminApiaries';
import type { ApiaryMapPoint } from 'shared-schemas';

// Fix for default marker icon issue with bundlers
const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

// Calculate bounds from apiaries to fit all markers
const getBounds = (
  apiaries: ApiaryMapPoint[],
): L.LatLngBoundsExpression | undefined => {
  if (apiaries.length === 0) return undefined;

  const lats = apiaries.map((a) => a.latitude);
  const lngs = apiaries.map((a) => a.longitude);

  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ];
};

// Default center (Europe)
const DEFAULT_CENTER: L.LatLngExpression = [48.5, 10.5];
const DEFAULT_ZOOM = 4;

export const AllApiariesMap: React.FC = () => {
  const { data: apiaries, isLoading, error } = useAdminApiariesMap();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        Loading map...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px] text-destructive">
        Failed to load apiaries
      </div>
    );
  }

  if (!apiaries || apiaries.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        No apiaries with coordinates found
      </div>
    );
  }

  const bounds = getBounds(apiaries);

  return (
    <div className="h-[400px] w-full border rounded-md overflow-hidden">
      <MapContainer
        className="w-full h-full"
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        bounds={bounds}
        boundsOptions={{ padding: [50, 50] }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {apiaries.map((apiary) => (
          <Marker
            key={apiary.id}
            position={[apiary.latitude, apiary.longitude]}
            icon={defaultIcon}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{apiary.name}</p>
                <p className="text-muted-foreground">
                  {apiary.hiveCount} {apiary.hiveCount === 1 ? 'hive' : 'hives'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {apiary.latitude.toFixed(4)}, {apiary.longitude.toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
