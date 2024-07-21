import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'formatarstring',
    standalone: true
})
export class FormatarStringPipe implements PipeTransform {
    transform(value: string): string | undefined {
        if (!value) {
            return;
        }

        const regex = /^[A-Z]{2}-\d+-[A-Z0-9]+$/;
        if (regex.test(value)) {
            return 'Área do imóvel'
        }

        if (!this.isNumber(value)) {
            let formatacao = value.toLowerCase().replace(/_/g, ' ');

            formatacao = formatacao
                .split(' ')
                .map(
                    (palavra) =>
                        palavra.charAt(0).toUpperCase() + palavra.slice(1)
                )
                .join(' ');

            if (
                [
                    'AREA_DE_PRESERVACAO_PERMANENTE_A_RECOMPOR_DE_RIOS_ATE_10_METROS',
                    'AREA_DE_PRESERVACAO_PERMANENTE_DE_RIOS_ATE_10_METROS',
                    'AREA_DE_PRESERVACAO_PERMANENTE_EM_AREA_DE_VEGETACAO_NATIVA',
                    'APP_TOTAL',
                ].includes(value)
            ) {
                /*
                const index = formatacao.indexOf('Area De Preservacao');
                if (index !== -1) {
                    formatacao = formatacao.substring(0, 'Area De Preservacao'.length);
                }*/

                    return 'Área de preservação permanente'
            }

            if (["CURSO_D'AGUA_NATURAL_DE_ATE_10_METROS"].includes(value)) {
                // formatacao = formatacao.replace(/ D'agua /g, " d'Água ");
                const index = formatacao.indexOf("Curso D'agua Natural");

                if (index !== 1) {
                    formatacao = "Curso d'agua";
                }
            }

            if (['AREA_CONSOLIDADA'].includes(value)) {
                return 'Área cultivável';
            }

            if (
                [
                    'REMANESCENTE_DE_VEGETACAO_NATIVA',
                    'AREA_DE_PRESERVACAO_PERMANENTE_EM_AREA_DE_VEGETACAO_NATIVA'
                ].includes(value)
            ) {
                return 'Vegetação nativa';
            }

            if (
                [
                    'RESERVA_LEGAL_PROPOSTA',
                    'AREA_DE_RESERVA_LEGAL_TOTAL'
                ].includes(value)
            ) {
                return 'Reserva legal';
            }

            return formatacao;
        }

        return value;
    }

    isNumber(str: any) {
        return !isNaN(parseFloat(str)) && isFinite(str);
    }
}
