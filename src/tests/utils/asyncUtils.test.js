import { describe, it, expect, vi } from 'vitest';
import { withTimeout } from '../../utils/asyncUtils';

describe('asyncUtils', () => {
    describe('withTimeout', () => {
        it('deve resolver se a promessa terminar antes do timeout', async () => {
            const promise = new Promise((resolve) => setTimeout(() => resolve('ok'), 50));
            const result = await withTimeout(promise, 100);
            expect(result).toBe('ok');
        });

        it('deve rejeitar se a promessa exceder o timeout', async () => {
            const promise = new Promise((resolve) => setTimeout(() => resolve('ok'), 200));
            await expect(withTimeout(promise, 50)).rejects.toThrow('Operação excedeu o tempo limite de 50ms.');
        });

        it('deve repassar o erro se a promessa falhar antes do timeout', async () => {
            const promise = new Promise((_, reject) => setTimeout(() => reject(new Error('fail')), 50));
            await expect(withTimeout(promise, 100)).rejects.toThrow('fail');
        });
    });
});
