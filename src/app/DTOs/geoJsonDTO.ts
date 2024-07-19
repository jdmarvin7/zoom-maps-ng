export interface GeoJson {
    type: string;
    coordinates: any;
}

export interface GeoJsonPoint extends GeoJson {
    type: 'Point';
    coordinates: [number, number];
}

export interface GeoJsonLineString extends GeoJson {
    type: 'LineString';
    coordinates: [number, number][];
}

export interface GeoJsonPolygon extends GeoJson {
    type: 'Polygon';
    coordinates: [number, number][][]; // Polygons can have multiple rings
}

// Add other GeoJSON types as needed...
