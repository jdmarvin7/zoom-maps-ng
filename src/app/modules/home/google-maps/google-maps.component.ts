import { Component, ElementRef, ViewChild } from '@angular/core';
import {
    GoogleMapsModule,
    MapAdvancedMarker,
    MapInfoWindow,
    MapMarker
} from '@angular/google-maps';
import { EditorCodigoComponent } from '../editor-codigo/editor-codigo.component';
import { CommonModule } from '@angular/common';
import * as togpx from '@tmcw/togeojson';
import { GoogleMapsService } from '../../../services/google-maps/google-maps.service';
import { Feature, GeoJson, Geometry } from '../../../DTOs/geoJsonDTO';
import { PolygonLatLng } from '../../../DTOs/polygonsLatLngDTO';
import { SharedModule } from '../../shared/shared.module';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { FormatarStringPipe } from '../../../pipes/formatar-string.pipe';
import { ActivatedRoute, Router } from '@angular/router';
import { PolygonParaGeoJSONFeature } from '../../../utils/polygonParaGeoJSONFeature';

@Component({
    selector: 'app-google-maps',
    standalone: true,
    imports: [
        MapMarker,
        GoogleMapsModule,
        EditorCodigoComponent,
        CommonModule,
        SharedModule,
        CdkDrag,
        FormatarStringPipe
    ], // TODO: Criar modules só com os modulos material angular
    providers: [FormatarStringPipe],
    templateUrl: './google-maps.component.html',
    styleUrl: './google-maps.component.scss'
})
export class GoogleMapsComponent {
    @ViewChild('map') mapContainer!: ElementRef;

    map!: google.maps.Map;
    mapOptions: google.maps.MapOptions = {
        mapTypeId: 'satellite',
        mapId: google.maps.MapTypeId.SATELLITE,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        scaleControl: false,
        zoomControl: false,
        disableDoubleClickZoom: false
    };
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

    abrirMinizarCheckboxs: boolean = true;
    bounds!: any;
    nomeArquivo!: string;

    // TODO: Criar infoview ao clicar no poligono
    infoView!: MapInfoWindow | undefined;

    constructor(
        private googleMapsService: GoogleMapsService,
        private formatStr: FormatarStringPipe,
        private route: ActivatedRoute,
        private router: Router
    ) {}

    initMap(map: google.maps.Map): void {
        this.map = map;
        this.desenharNoMapa();
        this.router.navigate([], {
            relativeTo: this.route
        });
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
        this.limparMaps();

        const reader = new FileReader();
        const tipoDoArquivo = file.name.split('.')[1];
        this.nomeArquivo = file.name.split('.')[0];

        reader.onload = (event) => {
            const conteudo = event.target?.result as string | GeoJson;
            switch (tipoDoArquivo) {
                case 'kml':
                    const geo = this.converterKmlparaGeoJSON(
                        conteudo as string
                    );
                    this.geoToLatLng(geo as GeoJson);
                    this.googleMapsService.setarGeoJson(geo);
                    break;

                case 'geojson':
                    const geojson = JSON.parse(conteudo as string);
                    this.geoToLatLng(geojson as GeoJson);
                    this.googleMapsService.setarGeoJson(geojson as string);
                    break;

                default:
                    throw new Error(
                        'Não suportamos esse arquivo ainda! ' + tipoDoArquivo
                    );
            }
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
                        let latLngPolygonsOptions: PolygonLatLng = {
                            nome: '',
                            visualizacao: true,
                            polygonsOptions: [],
                            polygons: []
                        };

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

                            const nome = this.formatStr.transform(
                                feature.properties['nome'] ||
                                    feature.properties['name']
                            ) as string;

                            let jaExisteNome = this.polygonsLatLng.find(
                                (obj) => obj.nome === nome
                            );

                            if (!jaExisteNome) {
                                latLngPolygonsOptions = {
                                    nome: nome,
                                    visualizacao: true,
                                    polygonsOptions: [],
                                    polygons: []
                                };
                                this.polygonsLatLng.push(latLngPolygonsOptions);
                                jaExisteNome = latLngPolygonsOptions; // Update the reference to the new object
                            }

                            jaExisteNome.polygonsOptions.push(options);
                            jaExisteNome.polygons.push(
                                new google.maps.Polygon(options)
                            );

                            // Update existing object in polygonsLatLng
                            this.polygonsLatLng = this.polygonsLatLng.map(
                                (obj) =>
                                    obj.nome === nome ? jaExisteNome : obj
                            );
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

    converterGeoJSONParaLatLng(
        geometry: Geometry
    ): google.maps.LatLng[] | undefined {
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
                return;

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
            this.polygonsLatLng.forEach((obj) => {
                const polygons: google.maps.Polygon[] = [];
                obj.polygons.forEach((polygon) => {
                    polygon.setMap(this.map);

                    polygon.addListener('click', () => {
                        console.log(polygon);
                    });
                    polygons.push(polygon);
                });
                this.pegarSetarCentro(polygons);
            });
        }
    }

    juntarAreasIguaisComNomesDiferentes(): void {}

    pegarSetarCentro(polygons: google.maps.Polygon[] | any[]): void {
        const bounds = new google.maps.LatLngBounds();

        polygons.forEach((polygon: any) => {
            polygon.getPath().forEach((point: google.maps.LatLng) => {
                bounds.extend(point);
            });
        });

        // TODO: Adicionar o "lat" e "lng" do centro dos poligonos na url da aplicação.
        // se tiver já tiver no query centralizar ao inicializar o camponente.
        this.bounds = bounds.getCenter();
        this.map?.setCenter(this.bounds);
        this.navegarParaLatLngCentralizador();

        this.zoom = this.map?.getZoom() as number;

        if (this.zoom < 15) {
            this.map?.setZoom(17);
        }
    }

    ativaDesativaPolygon(event: any, nome: string): void {
        const polygon = this.polygonsLatLng.find((poly) => poly.nome === nome);

        polygon?.polygons.forEach((poly_) => {
            poly_.setOptions({
                visible: event.checked
            });
            if (polygon) {
                polygon.visualizacao = poly_.getVisible() as boolean;
            }
        });
    }

    limparMaps(): void {
        this.polygonsLatLng.forEach((polygon: PolygonLatLng) => {
            polygon.polygons.forEach((poly_) => {
                poly_.setMap(null);
            });
        });
        this.polygonsLatLng = [];
    }

    // TODO: Criar um botão no maps chamado centralizar para que a gente consiga centralizar nas coordenadas importadas pelo user.
    centralizarMaps(): void {
        this.map?.setCenter(this.bounds);
        this.map?.setZoom(17);
    }

    navegarParaLatLngCentralizador(): void {
        const lat = this.bounds.lat();
        const lng = this.bounds.lng();

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
                lat,
                lng
            }
        });
    }

    criarInfoView(marker: MapAdvancedMarker): void {
        marker.options = {
            title: 'Teste'
        };
    }

    desenharNoMapa(): void {
        const drawingManager = new google.maps.drawing.DrawingManager({
            drawingMode: google.maps.drawing.OverlayType.POLYGON,
            drawingControl: true,
            drawingControlOptions: {
                position: google.maps.ControlPosition.BOTTOM_LEFT,
                drawingModes: [
                    google.maps.drawing.OverlayType.POLYGON,
                    google.maps.drawing.OverlayType.CIRCLE,
                    google.maps.drawing.OverlayType.MARKER,
                    google.maps.drawing.OverlayType.POLYLINE,
                    google.maps.drawing.OverlayType.RECTANGLE
                ]
            },
            polygonOptions: {
                editable: false
            }
        });
        drawingManager.setMap(this.map);

        drawingManager.addListener('overlaycomplete', (event: any) => {
            const shape = event.overlay;
            shape.type = event.type;
        });

        drawingManager.addListener('overlaycomplete', (event: any) => {
            // google.maps.event.addListener(event.overlay, "mouseup", (event_: any) => {
            //     // console.log(event_)
            // });
            const polygon = event.overlay;
            let nome = '';

            const options = {
                paths: polygon.getPath(),
                fillColor: '#5555FF',
                strokeColor: '#FFFF00',
                fillOpacity: 0.34901960784313724,
                strokeOpacity: 1,
                strokeWeight: 1.5,
                visible: true
            }

            polygon.setOptions(options);
            this.polygonParaFeature(polygon, options)

            this.polygonsLatLng.unshift({
                nome,
                polygons: [polygon],
                polygonsOptions: [options],
                visualizacao: true,
            });
            debugger;
        });
    }

    polygonParaFeature(polygon: google.maps.Polygon, properties: any): void {
        const feature = PolygonParaGeoJSONFeature.converte(polygon, properties);
        let geoJsonAtual!: any;
        this.googleMapsService.pegarGeoJson().subscribe({
            next: data => geoJsonAtual = data,
        });

        const geoJsonAtualJson: any = geoJsonAtual as GeoJson;
        if (geoJsonAtualJson && geoJsonAtualJson['features']) {
            geoJsonAtualJson['features'].unshift(feature);
        }
        const geoJsonAtualizado = geoJsonAtualJson;
        this.googleMapsService.setarGeoJson(geoJsonAtualizado as string);
    }
}
