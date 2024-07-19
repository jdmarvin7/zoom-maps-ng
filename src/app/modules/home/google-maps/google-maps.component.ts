import { Component, ElementRef, ViewChild } from '@angular/core';
import { GoogleMapsModule, MapMarker } from '@angular/google-maps';
import { EditorCodigoComponent } from '../editor-codigo/editor-codigo.component';
import { CommonModule } from '@angular/common';
import * as togpx from '@tmcw/togeojson';
import { GoogleMapsService } from '../../../services/google-maps/google-maps.service';
import { GeoJson } from '../../../DTOs/geoJsonDTO';

@Component({
    selector: 'app-google-maps',
    standalone: true,
    imports: [MapMarker, GoogleMapsModule, EditorCodigoComponent, CommonModule],
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

    constructor(
        private googleMapsService: GoogleMapsService,
    ) {}

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
            const latLng = this.converterGeoJSONParaLatLng(geo);
            this.googleMapsService.setarGeoJson(geo);
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

    converterGeoJSONParaLatLng(geoJSON: GeoJson): google.maps.LatLng | google.maps.LatLng[] | google.maps.LatLng[][] {
        switch (geoJSON.type) {
            case "Point":
              return new google.maps.LatLng(geoJSON.coordinates[1], geoJSON.coordinates[0]);

            case "LineString":
              return geoJSON.coordinates.map((coord: any) => new google.maps.LatLng(coord[1], coord[0]));

            case "Polygon":
              return geoJSON.coordinates.map((ring: any) => ring.map((coord: any) => new google.maps.LatLng(coord[1], coord[0])));

            // Add more cases for other geoJSON types as needed...

            default:
              throw new Error(`Unsupported geoJSON type: ${geoJSON.type}`);
          }
    }
}
