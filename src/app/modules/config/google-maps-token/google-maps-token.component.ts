import { Component, inject, model, signal } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { FormsModule } from '@angular/forms';
import {
    MAT_DIALOG_DATA,
    MatDialog,
    MatDialogRef
} from '@angular/material/dialog';

@Component({
    selector: 'app-google-maps-token',
    standalone: true,
    imports: [SharedModule, FormsModule],
    templateUrl: './google-maps-token.component.html',
    styleUrl: './google-maps-token.component.scss'
})
export class GoogleMapsTokenComponent {
    readonly dialogRef = inject(MatDialogRef<GoogleMapsTokenComponent>);
    readonly data = inject<{ token: string }>(MAT_DIALOG_DATA);
    readonly token = model(this.data.token);

    onNoClick(): void {
        this.dialogRef.close();
    }
}
