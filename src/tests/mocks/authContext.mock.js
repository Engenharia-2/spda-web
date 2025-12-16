import { vi } from 'vitest';

export const mockLogin = vi.fn();
export const mockSignup = vi.fn();
export const mockLogout = vi.fn();

export const mockAuthContext = {
    currentUser: null,
    login: mockLogin,
    signup: mockSignup,
    logout: mockLogout
};

vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: () => mockAuthContext
}));
