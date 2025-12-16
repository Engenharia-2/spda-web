import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../../services/AuthService';

// Mocks for Firebase Auth and Firestore
const mocks = vi.hoisted(() => ({
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
    updatePassword: vi.fn(),
    reauthenticateWithCredential: vi.fn(),
    deleteUser: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    doc: vi.fn(),
    auth: { currentUser: { uid: '123', email: 'test@example.com' } },
    db: {},
}));

vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => mocks.auth),
    signInWithEmailAndPassword: mocks.signInWithEmailAndPassword,
    createUserWithEmailAndPassword: mocks.createUserWithEmailAndPassword,
    signOut: mocks.signOut,
    sendPasswordResetEmail: mocks.sendPasswordResetEmail,
    updatePassword: mocks.updatePassword,
    reauthenticateWithCredential: mocks.reauthenticateWithCredential,
    EmailAuthProvider: {
        credential: vi.fn(),
    },
    deleteUser: mocks.deleteUser,
}));

vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => mocks.db),
    doc: mocks.doc,
    setDoc: mocks.setDoc,
    getDoc: mocks.getDoc,
}));

vi.mock('../../services/firebase', () => ({
    auth: mocks.auth,
    db: mocks.db,
}));

// Mock utils
vi.mock('../../utils/asyncUtils', () => ({
    withTimeout: vi.fn((promise) => promise),
}));

describe('AuthService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('signup', () => {
        it('deve criar usuário no Auth e documento no Firestore', async () => {
            const mockUser = { uid: 'new_uid', email: 'new@example.com' };
            mocks.createUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });
            mocks.setDoc.mockResolvedValue(undefined); // Success

            await AuthService.signup('new@example.com', 'password');

            expect(mocks.createUserWithEmailAndPassword).toHaveBeenCalledWith(mocks.auth, 'new@example.com', 'password');
            expect(mocks.setDoc).toHaveBeenCalled(); // creating users/new_uid
            expect(mocks.signOut).toHaveBeenCalled();
        });

        it('deve lançar erro se falhar no Auth', async () => {
            mocks.createUserWithEmailAndPassword.mockRejectedValue(new Error('Auth failed'));

            await expect(AuthService.signup('fail@example.com', 'pass')).rejects.toThrow('Auth failed');
            expect(mocks.setDoc).not.toHaveBeenCalled();
        });
    });

    describe('login', () => {
        it('deve logar com sucesso se conta aprovada e doc existir', async () => {
            const mockUser = { uid: '123' };
            mocks.signInWithEmailAndPassword.mockResolvedValue({ user: mockUser });

            // Mock getDoc to return exists=true and status=approved
            mocks.getDoc.mockResolvedValue({
                exists: () => true,
                data: () => ({ status: 'approved' })
            });

            const result = await AuthService.login('user@test.com', 'pass');
            expect(result.user.uid).toBe('123');
            expect(mocks.signOut).not.toHaveBeenCalled();
        });

        it('deve deslogar e lançar erro se conta pendente', async () => {
            const mockUser = { uid: 'pending_uid' };
            mocks.signInWithEmailAndPassword.mockResolvedValue({ user: mockUser });

            mocks.getDoc.mockResolvedValue({
                exists: () => true,
                data: () => ({ status: 'pending' })
            });

            await expect(AuthService.login('pending@test.com', 'pass')).rejects.toThrow('ACCOUNT_PENDING');
            expect(mocks.signOut).toHaveBeenCalled();
        });

        it('deve criar doc pendente se não existir e lançar ACCOUNT_PENDING', async () => {
            const mockUser = { uid: 'nodoc_uid', email: 'nodoc@test.com' };
            mocks.signInWithEmailAndPassword.mockResolvedValue({ user: mockUser });

            mocks.getDoc.mockResolvedValue({
                exists: () => false
            });
            mocks.setDoc.mockResolvedValue(undefined);

            await expect(AuthService.login('nodoc@test.com', 'pass')).rejects.toThrow('ACCOUNT_PENDING');
            expect(mocks.setDoc).toHaveBeenCalled(); // Should attempt to create it
            expect(mocks.signOut).toHaveBeenCalled();
        });
    });

    describe('logout', () => {
        it('deve chamar signOut', async () => {
            await AuthService.logout();
            expect(mocks.signOut).toHaveBeenCalledWith(mocks.auth);
        });
    });
});
