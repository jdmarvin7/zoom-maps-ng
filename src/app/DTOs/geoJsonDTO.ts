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
    type: 'Polygon' | 'MultiPolygon' | 'GeometryCollection' | 'Point' | 'MultiPoint' | 'LineString' | 'MultiLineString';
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

export interface MultiLineString extends Geometry {
    type: 'MultiLineString';
    coordinates: [number, number][][];
}

export interface Polygon extends Geometry {
    type: 'Polygon';
    coordinates: [number, number][][];
}

export interface MultiPolygon extends Geometry {
    type: 'MultiPolygon';
    coordinates: [number, number][][][];
}
