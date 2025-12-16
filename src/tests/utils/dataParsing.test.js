import { describe, it, expect } from 'vitest';
import {
    parseCustomFormat,
    parseMeasurementPoint,
    formatResistance,
    extractMeasurementDateTime
} from '../../utils/dataParsing';

describe('dataParsing', () => {
    describe('parseCustomFormat', () => {
        it('deve parsear cabeçalho customizado válido', () => {
            const result = parseCustomFormat('G1[1/2]:RestoDoTexto');
            expect(result).toEqual({
                groupId: 'G1',
                partIndex: 1,
                totalParts: 2,
                content: 'RestoDoTexto'
            });
        });

        it('deve retornar null para texto inválido', () => {
            expect(parseCustomFormat('TextoNormal')).toBeNull();
        });
    });

    describe('parseMeasurementPoint', () => {
        it('deve parsear ponto de medição completo m (miliohm)', () => {
            const str = 'P01=0,050m,0.0,,,';
            const result = parseMeasurementPoint(str);
            expect(result).toEqual({
                ponto: 1,
                resistencia: 0.00005,
                corrente: 0,
                dataHora: null
            });
        });

        it('deve parsear ponto com data/hora', () => {
            // Input: P1=1,0.0,010123,1230
            // Regex: P(\d+)=([\d,]+)(m?),([\d.]+)(?:,(\d{6}),(\d{4}))?
            // Group 1 (id): 1
            // Group 2 (res): 1 (matches [\d,]+ but stops at comma separator)
            // Group 3 (unit): empty (matches m?)
            // Separator: , matches
            // Group 4 (curr): 0.0
            // Group 5 (date): 010123
            // Group 6 (time): 1230
            const str = 'P1=1,0.0,010123,1230';
            const result = parseMeasurementPoint(str);
            expect(result).toMatchObject({
                ponto: 1,
                resistencia: 1.0,
                dataHora: '01/01/2023 12:30'
            });
        });

        it('deve retornar null se formato invalido', () => {
            expect(parseMeasurementPoint('Lixo')).toBeNull();
        });
    });

    describe('formatResistance', () => {
        it('deve retornar "-" para valores vazios', () => {
            expect(formatResistance(null)).toBe('-');
        });

        it('deve retornar valor original se NaN', () => {
            expect(formatResistance('abc')).toBe('abc');
        });

        it('deve formatar valores < 1 em mΩ', () => {
            expect(formatResistance(0.001)).toBe('1.000 m');
            expect(formatResistance('0.5')).toBe('500.000 m');
        });

        it('deve formatar valores >= 1 normalmente', () => {
            expect(formatResistance(1.5)).toBe('1.500');
        });
    });

    describe('extractMeasurementDateTime', () => {
        it('deve retornar "Não Informado" se array vazio', () => {
            expect(extractMeasurementDateTime({ parsedData: [] })).toEqual({
                date: 'Não Informado',
                startTime: 'Não Informado',
                endTime: 'Não Informado'
            });
        });

        it('deve extrair data e hora inicio/fim', () => {
            const data = {
                parsedData: [
                    { dataHora: '10/01/2023 08:00' },
                    { dataHora: '10/01/2023 09:30' }
                ]
            };
            const result = extractMeasurementDateTime(data);
            expect(result).toEqual({
                date: '10/01/2023',
                startTime: '08:00',
                endTime: '09:30'
            });
        });
    });
});
