import { Component, ElementRef, ViewChild } from '@angular/core';
import { GoogleMapsModule, MapMarker } from '@angular/google-maps';
import { EditorCodigoComponent } from '../editor-codigo/editor-codigo.component';
import { CommonModule } from '@angular/common';
import * as togpx from '@tmcw/togeojson';
import { GoogleMapsService } from '../../../services/google-maps/google-maps.service';
import { Feature, GeoJson, Geometry } from '../../../DTOs/geoJsonDTO';
import { PolygonLatLng } from '../../../DTOs/polygonsLatLngDTO';
import { SharedModule } from '../../shared/shared.module';

@Component({
    selector: 'app-google-maps',
    standalone: true,
    imports: [MapMarker, GoogleMapsModule, EditorCodigoComponent, CommonModule, SharedModule], // TODO: Criar modules só com os modulos material angular
    templateUrl: './google-maps.component.html',
    styleUrl: './google-maps.component.scss'
})
export class GoogleMapsComponent {
    @ViewChild('map') mapContainer!: ElementRef;

    map!: google.maps.Map;
    center: google.maps.LatLngLiteral = {
        lat: -14.235004,
        lng: -51.92528
    };
    zoom = 8;
    markerOptions: google.maps.MarkerOptions = {
        draggable: false
    };
    markers: google.maps.LatLngLiteral[] = [];
    coordenadasTipoLatLng: any = [];
    polygonsLatLng: PolygonLatLng[] = [];

    constructor(private googleMapsService: GoogleMapsService) {}

    initMap(map: google.maps.Map): void {
        this.map = map;
    }

    criarMarker(event: google.maps.MapMouseEvent): void {
        const position = event?.latLng?.toJSON();
        if (!position) {
            return;
        }

        const marker = new google.maps.Marker({
            position: position,
            map: this.map,
            title: 'Click to remove',
            clickable: true,
            label: {
                text: 'x',
                color: '#FF0000',
                fontSize: '16px'
            }
        });

        marker.addListener('click', () => {
            marker.setMap(null);
        });

        this.markers.push(position);
    }

    getFileContent(file: File): void {
        const reader = new FileReader();
        reader.onload = (event) => {
            const kmlString = event.target?.result as string;
            const geo = this.converterKmlparaGeoJSON(kmlString);
            this.googleMapsService.setarGeoJson(geo);
            const latLng = this.geoToLatLng(geo);
        };
        reader.readAsText(file);
    }

    arquivoSelecionado(event: Event): void {
        const inputEl = event.target as HTMLInputElement;
        if (inputEl && inputEl.files) {
            const file = inputEl.files[0];
            this.getFileContent(file);
        }
    }

    converterKmlparaGeoJSON(kml: string): any {
        const parser = new DOMParser();
        const root = parser.parseFromString(kml, 'application/xml');
        const geoJSON = togpx.kml(root);
        return geoJSON;
    }

    geoToLatLng(geojson: GeoJson): void {
        switch (geojson.type) {
            case 'FeatureCollection':
                const features: Feature[] | undefined = geojson.features;
                if (features) {
                    let data: google.maps.LatLng[] | undefined = [];
                    features.forEach((feature) => {
                        let latLngPolygonsOptions: PolygonLatLng;

                        if (feature.geometry.type !== 'GeometryCollection') {
                            const donees = this.converterGeoJSONParaLatLng(
                                feature.geometry
                            );
                            data = donees;
                        } else {
                            const outro = this.converterGeometryCollection(
                                feature.geometry
                            );
                            data = outro;
                        }

                        if (data) {
                            const options: google.maps.PolygonOptions = {
                                paths: data,
                                fillColor: feature.properties.fill || '#0284C7',
                                strokeColor:
                                    feature.properties.stroke || 'black',
                                fillOpacity:
                                    feature.properties['fill-opacity'] || 0.6,
                                strokeOpacity:
                                    feature.properties['stroke-opacity'] || 1,
                                strokeWeight:
                                    feature.properties['stroke-width'] || 1
                            };

                            latLngPolygonsOptions = {
                                nome:
                                    feature.properties['nome'] ||
                                    feature.properties['name'],
                                polygonsOptions: [],
                                polygons: [],
                            };
                            latLngPolygonsOptions.polygonsOptions.push(options);
                            latLngPolygonsOptions.polygons.push(new google.maps.Polygon(options));

                            this.polygonsLatLng.push(latLngPolygonsOptions);
                        }
                    });
                    this.desenharNoMaps();
                }

                break;

            case 'Feature':
                // TODO
                return;

            case 'Linestring':
                // TODO
                return;
        }
    }

    converterGeometryCollection(geometry: Geometry): google.maps.LatLng[] {
        let latLngCoords: any[] = [];
        if (geometry.geometries) {
            geometry.geometries.forEach((geo: any) => {
                const data = this.converterGeoJSONParaLatLng(geo);
                latLngCoords.push(data);
            });
        }

        return latLngCoords;
    }

    converterGeoJSONParaLatLng(geometry: Geometry): google.maps.LatLng[] | undefined {
        switch (geometry.type) {
            case 'Point':
                const coord = new google.maps.LatLng(
                    geometry?.coordinates[1],
                    geometry?.coordinates[0]
                );

                const marker = new google.maps.Marker({
                    position: coord,
                    map: this.map,
                    title: 'Click to remove',
                    clickable: true,
                    label: {
                        text: 'x',
                        color: '#FF0000',
                        fontSize: '16px'
                    }
                });
                return

            case 'LineString':
                return geometry.coordinates.map(
                    (coord: any) => new google.maps.LatLng(coord[1], coord[0])
                );

            case 'Polygon':
                return geometry.coordinates[0].map(
                    (coord: any) => new google.maps.LatLng(coord[1], coord[0])
                );

            case 'MultiPolygon':
                const paths: google.maps.LatLng[] = [];
                geometry.coordinates.forEach((coordinate: any) => {
                    const subPaths = coordinate[0].map(
                        (coord: any) =>
                            new google.maps.LatLng(coord[1], coord[0])
                    );
                    paths.push(...subPaths);
                });
                return paths;

            default:
                throw new Error(`Unsupported geometry type: ${geometry.type}`);
        }
    }

    desenharNoMaps(): void {
        if (this.polygonsLatLng.length) {
            this.polygonsLatLng.forEach(obj => {
                const polygons: google.maps.Polygon[] = [];
                obj.polygons.forEach(polygon => {
                    polygon.setMap(this.map);
                    polygons.push(polygon);
                });
                this.pegarSetarCentro(polygons);
            })
        }
    }

    pegarSetarCentro(polygons: google.maps.Polygon[] | any[]): void {
        const bounds = new google.maps.LatLngBounds();

        polygons.forEach((polygon: any) => {
            polygon.getPath().forEach((point: google.maps.LatLng) => {
                bounds.extend(point);
            });
        });

        const centerLatLng = bounds.getCenter();
        this.map?.setCenter(centerLatLng);

        this.zoom = this.map?.getZoom() as number;

        if (this.zoom < 15) {
            this.map?.setZoom(17);
        }
    }

    ativaDesativaPolygon(event: any, nome: string): void {
        const polygon = this.polygonsLatLng.find(poly => poly.nome === nome);
        polygon?.polygons.forEach(poly_ => {
            poly_.setOptions({
                visible: event.checked,
            })
        })
    }
}
