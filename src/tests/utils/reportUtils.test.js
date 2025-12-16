import { describe, it, expect } from 'vitest';
import { getMeasurementDate, formatReportStatus, getEngineerName, getClientName } from '../../utils/reportUtils';

describe('reportUtils', () => {
    describe('getMeasurementDate', () => {
        it('deve retornar N/A se sem medições', () => {
            expect(getMeasurementDate({})).toBe('N/A');
            expect(getMeasurementDate({ measurements: {} })).toBe('N/A');
            expect(getMeasurementDate({ measurements: { parsedData: [] } })).toBe('N/A');
        });

        it('deve retornar data da primeira medição', () => {
            const report = {
                measurements: {
                    parsedData: [
                        { dataHora: '25/12/2023 10:00' }
                    ]
                }
            };
            expect(getMeasurementDate(report)).toBe('25/12/2023');
        });
    });

    describe('formatReportStatus', () => {
        it('deve retornar Emitido', () => {
            expect(formatReportStatus('completed')).toBe('Emitido');
        });

        it('deve retornar Rascunho', () => {
            expect(formatReportStatus('draft')).toBe('Rascunho');
            expect(formatReportStatus('anything')).toBe('Rascunho');
        });
    });

    describe('getEngineerName', () => {
        it('deve retornar nome do engenheiro', () => {
            expect(getEngineerName({ engineer: 'Eng. John' })).toBe('Eng. John');
        });

        it('deve retornar default Eu', () => {
            expect(getEngineerName({})).toBe('Eu');
        });
    });

    describe('getClientName', () => {
        it('deve retornar nome do cliente', () => {
            expect(getClientName({ client: 'Acme Corp' })).toBe('Acme Corp');
        });

        it('deve retornar default', () => {
            expect(getClientName({})).toBe('Sem Cliente');
        });
    });
});
