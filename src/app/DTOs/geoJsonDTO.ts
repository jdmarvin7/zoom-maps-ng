export interface GeoJson {
    type: 'Linestring' | 'Feature' | 'FeatureCollection';
    coordinates?: any;
    feature?: Feature;
    features?: Feature[];
    geometry?: Geometry;
    properties?: any;
}

export interface Feature {
    type: 'Feature';
    geometry: Geometry;
    properties: any;
    id?: string;
}

export interface Geometry {
    type: string;
    coordinates?: any
    geometries?: GeometryCollection[];
}

export interface GeometryCollection {
    type: 'GeometryCollection';
    geometries: Geometry[];
}

export interface Point extends Geometry {
    type: 'Point';
    coordinates: [number, number];
}

export interface MultiPoint extends Geometry {
    type: 'MultiPoint';
    coordinates: [number, number][];
}

export interface LineString extends Geometry {
    type: 'LineString';
    coordinates: [number, number][];
}

export interface MultiLinestring extends Geometry {
    type: 'MultiLinestring';
    coordinates: [number, number][][];
}

export interface Polygon extends Geometry {
    type: 'Polygon';
    coordinates: [number, number][][]; // Polygons can have multiple rings
}

export interface MultiPolygon extends Geometry {
    type: 'MultiPolygon';
    coordinates: [number, number][][][];
}
