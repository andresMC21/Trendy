/** Punto que viaja en la API: { lat, lng } */
export interface GeoPoint {
  lat: number;
  lng: number;
}

/** Formato GeoJSON que TypeORM usa para columnas PostGIS (orden: [lng, lat]) */
export interface GeoJsonPoint {
  type: 'Point';
  coordinates: [number, number];
}

export const toGeoJson = (p: GeoPoint): GeoJsonPoint => ({
  type: 'Point',
  coordinates: [p.lng, p.lat],
});

export const fromGeoJson = (p: GeoJsonPoint): GeoPoint => ({
  lat: p.coordinates[1],
  lng: p.coordinates[0],
});
