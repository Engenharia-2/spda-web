import { waitFor } from '@testing-library/react';
import { vi } from 'vitest';

/**
 * Helper para aguardar mudanças de estado assíncronas
 */
export const waitForValueToChange = async (getValue, timeout = 3000) => {
    const initialValue = getValue();
    await waitFor(
        () => {
            expect(getValue()).not.toBe(initialValue);
        },
        { timeout }
    );
};

/**
 * Helper para criar erro do Firebase
 */
export const createFirebaseError = (code, message) => {
    const error = new Error(message);
    error.code = code;
    return error;
};

/**
 * Helper para simular evento de formulário
 */
export const createFormEvent = (overrides = {}) => ({
    preventDefault: vi.fn(),
    ...overrides
});

/**
 * Helper para criar mock de usuário do Firebase
 */
export const createMockUser = (overrides = {}) => ({
    uid: 'test-uid-123',
    email: 'test@example.com',
    emailVerified: true,
    ...overrides
});

/**
 * Helper para criar mock de documento do Firestore
 */
export const createMockDocSnapshot = (data, exists = true) => ({
    exists: () => exists,
    data: () => data,
    id: 'mock-doc-id'
});

/**
 * Helper para criar mock de cliente
 */
export const createMockClient = (overrides = {}) => ({
    id: 'client-123',
    name: 'Empresa Teste LTDA',
    address: 'Rua Teste, 123',
    contactName: 'João Silva',
    email: 'joao@teste.com',
    phone: '(11) 98765-4321',
    userId: 'user-123',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    ...overrides
});

/**
 * Helper para criar lista de clientes mock
 */
export const createMockClientList = (count = 3) => {
    return Array.from({ length: count }, (_, i) =>
        createMockClient({
            id: `client-${i + 1}`,
            name: `Cliente ${i + 1}`,
            contactName: `Contato ${i + 1}`,
            email: `contato${i + 1}@teste.com`
        })
    );
};
