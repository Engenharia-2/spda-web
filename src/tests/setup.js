import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';

// Cleanup automático após cada teste
afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

// Mock do window.alert
global.alert = vi.fn();

// Mock do window.confirm
global.confirm = vi.fn(() => true);

// Mock do console.error para evitar poluição nos logs de teste
const originalError = console.error;
beforeAll(() => {
    console.error = (...args) => {
        if (
            typeof args[0] === 'string' &&
            args[0].includes('Warning: ReactDOM.render')
        ) {
            return;
        }
        originalError.call(console, ...args);
    };
});

afterAll(() => {
    console.error = originalError;
});
