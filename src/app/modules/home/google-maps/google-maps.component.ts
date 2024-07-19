import { Component, ElementRef, ViewChild } from '@angular/core';
import { GoogleMapsModule } from '@angular/google-maps';
import { EditorCodigoComponent } from '../editor-codigo/editor-codigo.component';

@Component({
    selector: 'app-google-maps',
    standalone: true,
    imports: [
        GoogleMapsModule,
        EditorCodigoComponent,
    ],
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

    moveMap(event: google.maps.MapMouseEvent): void {
        console.log(event.latLng?.toJSON());
    }

    initMap(map: google.maps.Map): void {
        this.map = map;
    }
}
