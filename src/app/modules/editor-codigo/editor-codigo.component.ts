import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as ace from 'ace-builds';

@Component({
  selector: 'app-editor-codigo',
  standalone: true,
  imports: [],
  templateUrl: './editor-codigo.component.html',
  styleUrl: './editor-codigo.component.scss'
})
export class EditorCodigoComponent implements OnInit, AfterViewInit{
  @ViewChild('editor') private editor!: ElementRef<HTMLElement>;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    ace.config.set("fontSize", "16px");
    ace.config.set(
       'basePath',
      "https://ace.c9.io/build/src-noconflict/"
    );

    const aceEditor = ace.edit(this.editor.nativeElement);
    aceEditor.session.setMode("ace/mode/javascript");
    aceEditor.setTheme("ace/theme/monokai");
    aceEditor.setOptions({
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
    aceEditor.session.setValue('{\n\t"key": "value"\n}');
    aceEditor.on('change', () => {
      console.log(aceEditor.getSelectedText());
    });
 }
}
