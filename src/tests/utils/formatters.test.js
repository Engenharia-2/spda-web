import { describe, it, expect } from 'vitest';
import { formatUnit } from '../../utils/formatters';

describe('formatters', () => {
    describe('formatUnit', () => {
        it('deve retornar "-" para valor vazio', () => {
            expect(formatUnit(null, 'A')).toBe('-');
            expect(formatUnit(undefined, 'A')).toBe('-');
            expect(formatUnit('', 'A')).toBe('-');
        });

        it('deve formatar valores invalidos como string original', () => {
            expect(formatUnit('abc', 'A')).toBe('abc');
        });

        it('deve formatar zero', () => {
            expect(formatUnit(0, 'A')).toBe('0 A');
        });

        it('deve formatar mega (M)', () => {
            expect(formatUnit(1000000, 'Ω')).toBe('1.00 MΩ');
            expect(formatUnit(-2000000, 'W')).toBe('-2.00 MW');
            // Code: absNum = Math.abs(num); if (absNum >= 1e6) return `${(num / 1e6).toFixed(2)} M${unit}`;
            // So for -2000000 -> -2.00 MW.
        });

        it('deve formatar kilo (k)', () => {
            expect(formatUnit(1500, 'V')).toBe('1.50 kV');
        });

        it('deve formatar unidade base', () => {
            expect(formatUnit(10, 'A')).toBe('10.00 A');
        });

        it('deve formatar mili (m)', () => {
            expect(formatUnit(0.05, 'A')).toBe('50.00 mA');
        });

        it('deve formatar micro (µ)', () => {
            expect(formatUnit(0.000005, 'A')).toBe('5.00 µA');
        });

        it('deve formatar valores muito pequenos sem prefixo', () => {
            // < 1e-6
            expect(formatUnit(0.0000001, 'A')).toBe('1e-7 A');
        });
    });
});
