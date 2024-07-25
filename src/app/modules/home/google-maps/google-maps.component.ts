import {
    ChangeDetectorRef,
    Component,
    ElementRef,
    Inject,
    inject,
    model,
    OnInit,
    Renderer2,
    ViewChild
} from '@angular/core';
import {
    GoogleMapsModule,
    MapAdvancedMarker,
    MapInfoWindow,
    MapMarker
} from '@angular/google-maps';
import { EditorCodigoComponent } from '../editor-codigo/editor-codigo.component';
import { CommonModule, DOCUMENT } from '@angular/common';
import * as togpx from '@tmcw/togeojson';
import { GoogleMapsService } from '../../../services/google-maps/google-maps.service';
import { Feature, GeoJson, Geometry } from '../../../DTOs/geoJsonDTO';
import { PolygonLatLng } from '../../../DTOs/polygonsLatLngDTO';
import { SharedModule } from '../../shared/shared.module';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { FormatarStringPipe } from '../../../pipes/formatar-string.pipe';
import { ActivatedRoute, Router } from '@angular/router';
import { PolygonParaGeoJSONFeature } from '../../../utils/polygonParaGeoJSONFeature';
import {
    MAT_DIALOG_DATA,
    MatDialog,
    MatDialogRef
} from '@angular/material/dialog';
import { GoogleMapsTokenComponent } from '../../config/google-maps-token/google-maps-token.component';

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
export class GoogleMapsComponent implements OnInit {
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
    desenhado = 1;
    geoJsonEmVizualizacao: any = '';

    // TODO: Criar infoview ao clicar no poligono
    infoView!: MapInfoWindow | undefined;

    // token
    // readonly animal = signal('');
    readonly token = model('');
    readonly dialog = inject(MatDialog);

    constructor(
        private googleMapsService: GoogleMapsService,
        private formatStr: FormatarStringPipe,
        private route: ActivatedRoute,
        private router: Router,
        private renderer: Renderer2,
        @Inject(DOCUMENT) private document: Document,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        // this.atualizaMap();

        this.googleMapsService.pegarGeoJson().subscribe({
            next: (data) => {
                this.limparMaps();
                this.geoJsonEmVizualizacao =
                    typeof data === 'string' ? JSON.parse(data) : data;
                if (this.geoJsonEmVizualizacao) {
                    this.geoToLatLng(this.geoJsonEmVizualizacao);
                }
                this.cdr.detectChanges();
            }
        });
    }

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
                    this.geoJsonEmVizualizacao = this.converterKmlparaGeoJSON(
                        conteudo as string
                    );
                    this.geoToLatLng(this.geoJsonEmVizualizacao as GeoJson);
                    this.googleMapsService.setarGeoJson(
                        this.geoJsonEmVizualizacao
                    );
                    break;

                case 'geojson':
                    this.geoJsonEmVizualizacao = JSON.parse(conteudo as string);
                    this.geoToLatLng(this.geoJsonEmVizualizacao as GeoJson);
                    this.googleMapsService.setarGeoJson(
                        this.geoJsonEmVizualizacao as string
                    );
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
                                jaExisteNome = latLngPolygonsOptions;
                            }

                            jaExisteNome.polygonsOptions.push(options);
                            jaExisteNome.polygons.push(
                                new google.maps.Polygon(options)
                            );

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
            drawingMode: google.maps.drawing.OverlayType.MARKER,
            drawingControl: true,
            drawingControlOptions: {
                position: google.maps.ControlPosition.TOP_LEFT,
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
            let nome = `Desenhado manualmente ${this.desenhado++}`;

            const options = {
                paths: polygon.getPath(),
                fillColor: '#5555FF',
                strokeColor: '#FFFF00',
                fillOpacity: 0.34901960784313724,
                strokeOpacity: 1,
                strokeWeight: 1.5,
                visible: true
            };

            polygon.setOptions(options);
            this.polygonParaFeature(polygon, options);

            this.polygonsLatLng.unshift({
                nome,
                polygons: [polygon],
                polygonsOptions: [options],
                visualizacao: true
            });
        });
    }

    polygonParaFeature(polygon: google.maps.Polygon, properties: any): void {
        const feature = PolygonParaGeoJSONFeature.converte(polygon, properties);
        let geoJsonAtual!: any;
        this.googleMapsService.pegarGeoJson().subscribe({
            next: (data) => (geoJsonAtual = data)
        });

        const geoJsonAtualJson: any = geoJsonAtual as GeoJson;
        if (geoJsonAtualJson && geoJsonAtualJson['features']) {
            geoJsonAtualJson['features'].unshift(feature);
        }
        const geoJsonAtualizado = geoJsonAtualJson;
        this.googleMapsService.setarGeoJson(geoJsonAtualizado as string);
    }

    openDialog(): void {
        const dialogRef = this.dialog.open(GoogleMapsTokenComponent, {
            data: { token: this.token() }
        });

        dialogRef.afterClosed().subscribe((result) => {
            console.log('Esse modol foi fechado');

            if (result !== undefined) {
                this.token.set(result);
                // this.atualizarToken(this.token());
            }
        });
    }

    atualizarToken(token: string): void {
        const oldScript = this.document.querySelector(
            `script[src^="https://maps.googleapis.com/maps/api/js?key="]`
        );

        if (oldScript) {
            oldScript.parentNode?.removeChild(oldScript);
        }

        // const script = this.document.createElement('script');
        // script.type = 'text/javascript';
        // script.src = `https://maps.googleapis.com/maps/api/js?key=${token}&libraries=drawing`;
        // script.async = true;
        // this.renderer.appendChild(this.document.head, script);

        new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = `https://maps.googleapis.com/maps/api/js?key=${token}&libraries=drawing`;
            script.async = true;
            script.onload = () => {
                console.log('Google Maps script loaded successfully.');
                resolve('');
            };
            script.onerror = () => {
                console.error('Error loading Google Maps script.');
                reject(new Error('Error loading Google Maps script.'));
            };
            this.renderer.appendChild(this.document.head, script);
        });
    }

    atualizaMap(): void {
        if (this.map) {
        }
    }

    salvarArquivoComo(
        content: string,
        fileName: string,
        fileType: string
    ): void {
        const blob = new Blob([JSON.stringify(content)], { type: fileType });
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        window.URL.revokeObjectURL(url);
    }

    geoJsonParaKML(geojson: any): string {
        const geojsonDOM = new DOMParser().parseFromString(
            JSON.stringify(geojson),
            'application/geo+json' as any
        );
        const kml = togpx.kml(geojsonDOM) as any;
        const serializer = new XMLSerializer();
        return serializer.serializeToString(kml);
    }

    featureCollectionToKML(featureCollection: any): string {
        // Example of manually creating a simple KML string from a FeatureCollection
        // This is highly simplified and would need to be expanded based on your actual data structure
        let kmlString = '<?xml version="1.0" encoding="UTF-8"?>';
        kmlString += '<kml xmlns="http://www.opengis.net/kml/2.2">';
        kmlString += '<Document>';

        featureCollection.features.forEach((feature: any) => {
            // Assuming each feature has a geometry and properties
            kmlString += `<Placemark>`;
            kmlString += `<name>${feature.properties.name}</name>`;
            // Convert geometry coordinates to KML format
            // This is a placeholder; you'll need to adapt it based on your geometry type
            kmlString += `<Point><coordinates>${feature.geometry.coordinates.join(
                ','
            )}</coordinates></Point>`;
            kmlString += '</Placemark>';
        });

        kmlString += '</Document>';
        kmlString += '</kml>';

        return kmlString;
    }
}
