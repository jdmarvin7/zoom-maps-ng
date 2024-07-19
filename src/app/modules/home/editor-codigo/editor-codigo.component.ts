import { CommonModule } from '@angular/common';
import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    ElementRef,
    Input,
    OnDestroy,
    OnInit,
    ViewChild
} from '@angular/core';
import * as ace from 'ace-builds';
import { GoogleMapsService } from '../../../services/google-maps/google-maps.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-editor-codigo',
    standalone: true,
    imports: [
        CommonModule,
    ],
    templateUrl: './editor-codigo.component.html',
    styleUrl: './editor-codigo.component.scss'
})
export class EditorCodigoComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('editor') private editor!: ElementRef<HTMLElement>;
    @Input() classes = 'w-1/2 h-[80vh]';
    conteudo!: string;

    private subscription!: Subscription;
    aceEditor!: ace.Ace.Editor;

    constructor(
        private googleMapsService: GoogleMapsService,
        private cdr: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this.subscription = this.googleMapsService.pegarGeoJson().subscribe({
            next: (data) => {
                this.conteudo = JSON.stringify(data, null, 2);
                if (this.aceEditor) {
                    this.aceEditor?.session.setValue(this.conteudo);
                }
                this.cdr.detectChanges();
            },
        })
    }

    ngAfterViewInit(): void {
        this.criarIDE();
    }

    criarIDE(): void {
        ace.config.set('fontSize', '16px');
        ace.config.set('basePath', 'https://ace.c9.io/build/src-noconflict/');

        this.aceEditor = ace.edit(this.editor?.nativeElement);
        this.aceEditor.session.setMode('ace/mode/json');
        this.aceEditor.setTheme('ace/theme/monokai');
        this.aceEditor.setOptions({
            enableBasicAutocompletion: true,
            enableSnippets: true,
            enableLiveAutocompletion: true,
            highlightActiveLine: true,
            highlightSelectedWord: true,
            tabSize: 4,
            useSoftTabs: true,
            showPrintMargin: false
        });

        // Set initial content and handle changes
        this.aceEditor.session.setValue(this.conteudo);
        this.aceEditor.on('change', () => {
            const value = this.aceEditor.getValue();
        });
    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }
}
