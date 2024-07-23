import { Feature, Geometry } from "../DTOs/geoJsonDTO";

export class PolygonParaGeoJSONFeature {
    static converte(polygon: any, properties: any, id?: string): Feature {
        const path = polygon.getPath().getArray();

        // Convert the path to an array of [lng, lat] pairs
        const coordinates = path.map((point: any) => [point.lng(), point.lat(), 0]);

        // GeoJSON requires the first and last points to be the same to form a closed ring
        if (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
            coordinates[0][1] !== coordinates[coordinates.length - 1][1]) {
            coordinates.push(coordinates[0]);
        }

        const geometry: Geometry = {
            type: 'Polygon',
            coordinates: [coordinates],
        };

        const feature: Feature = {
            type: 'Feature',
            geometry: geometry,
            properties: properties
        };

        if (id) {
            feature.id = id;
        }

        return feature;
    }

    convertGoogleMapsPolygonToLatLng(polygon: any) {
        const path = polygon.getPath().getArray();

        const latLngArray = path.map((point: any) => ({
            lat: point.lat(),
            lng: point.lng()
        }));

        return latLngArray;
    }
}
