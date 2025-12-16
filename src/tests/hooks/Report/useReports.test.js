import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useReports } from '../../../hooks/Report/useReports';

// Mocks definition
const mocks = vi.hoisted(() => ({
    useAuth: vi.fn(),
    navigate: vi.fn(),
    getUserReports: vi.fn(),
    saveReport: vi.fn(),
    getReport: vi.fn(),
    deleteReport: vi.fn(),
    getSetting: vi.fn(),
    getDefaultChecklist: vi.fn(),
    generateReport: vi.fn(),
    locationState: { search: '' }
}));

// Apply mocks
vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: mocks.useAuth
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => mocks.navigate,
    useLocation: () => mocks.locationState
}));

vi.mock('../../../services/StorageService', () => ({
    StorageService: {
        getUserReports: mocks.getUserReports,
        saveReport: mocks.saveReport,
        getReport: mocks.getReport,
        deleteReport: mocks.deleteReport,
    }
}));

vi.mock('../../../services/SettingsService', () => ({
    SettingsService: {
        getSetting: mocks.getSetting,
        getDefaultChecklist: mocks.getDefaultChecklist
    }
}));

vi.mock('../../../utils/PDFGenerator', () => ({
    generateReport: mocks.generateReport
}));

describe('useReports', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Default implementations
        mocks.useAuth.mockReturnValue({ currentUser: { uid: 'user-123' } });
        mocks.getUserReports.mockResolvedValue([]);
        mocks.getDefaultChecklist.mockReturnValue([]);
        mocks.locationState.search = '';

        // Silence logs
        vi.spyOn(console, 'log').mockImplementation(() => { });
        vi.spyOn(console, 'error').mockImplementation(() => { });
        global.alert = vi.fn();
        global.confirm = vi.fn(() => true);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Listagem', () => {
        it('deve buscar relatórios ao inicializar', async () => {
            const data = [{ id: '1', client: 'A' }, { id: '2', client: 'B' }];
            mocks.getUserReports.mockResolvedValue(data);

            const { result } = renderHook(() => useReports());

            expect(result.current.listLoading).toBe(true);
            await waitFor(() => expect(result.current.listLoading).toBe(false));

            expect(mocks.getUserReports).toHaveBeenCalledWith('user-123');
            expect(result.current.filteredReports).toHaveLength(2);
        });

        it('deve filtrar relatórios por termo de busca', async () => {
            const data = [{ id: '1', client: 'Alpha' }, { id: '2', client: 'Beta' }];
            mocks.getUserReports.mockResolvedValue(data);

            const { result } = renderHook(() => useReports());
            await waitFor(() => expect(result.current.listLoading).toBe(false));

            act(() => {
                result.current.setSearchTerm('Alpha');
            });

            expect(result.current.filteredReports).toHaveLength(1);
            expect(result.current.filteredReports[0].client).toBe('Alpha');

            act(() => {
                result.current.setSearchTerm('Beta');
            });
            expect(result.current.filteredReports[0].client).toBe('Beta');
        });

        it('deve deletar relatório', async () => {
            mocks.getUserReports.mockResolvedValue([{ id: '1' }]);
            mocks.deleteReport.mockResolvedValue();

            const { result } = renderHook(() => useReports());
            await waitFor(() => expect(result.current.listLoading).toBe(false));

            await act(async () => {
                await result.current.deleteReport('1');
            });

            expect(global.confirm).toHaveBeenCalled();
            expect(mocks.deleteReport).toHaveBeenCalledWith('1');
        });
    });

    describe('Formulário', () => {
        it('deve inicializar vazio se não houver ID na URL', () => {
            const { result } = renderHook(() => useReports());
            expect(result.current.formData).toEqual({});
            expect(result.current.activeStep).toBe(0);
        });

        it('deve carregar relatório para edição', async () => {
            mocks.locationState.search = '?id=123';
            const report = { id: '123', client: 'Test' };
            mocks.getReport.mockResolvedValue(report);

            const { result } = renderHook(() => useReports());

            expect(result.current.formLoading).toBe(true);
            await waitFor(() => expect(result.current.formLoading).toBe(false));

            expect(mocks.getReport).toHaveBeenCalledWith('123');
            expect(result.current.formData).toEqual(report);
        });

        it.skip('deve salvar rascunho', async () => {
            mocks.locationState.search = '';
            mocks.saveReport.mockResolvedValue('new-id');

            const { result } = renderHook(() => useReports());

            act(() => {
                result.current.updateData({ client: 'New' });
            });

            await act(async () => {
                await result.current.saveDraft();
            });

            expect(mocks.saveReport).toHaveBeenCalledWith(
                'user-123',
                expect.objectContaining({ client: 'New', status: 'draft' }),
                undefined
            );

            await waitFor(() => {
                expect(result.current.reportId).toBe('new-id');
            });
        });

        it('deve navegar entre passos', () => {
            const { result } = renderHook(() => useReports());
            act(() => result.current.goToNextStep());
            expect(result.current.activeStep).toBe(1);
            act(() => result.current.goToPrevStep());
            expect(result.current.activeStep).toBe(0);
        });

        it('deve finalizar relatório (wizard flow)', async () => {
            mocks.locationState.search = '?id=123';
            mocks.getReport.mockResolvedValue({ id: '123' });
            mocks.getSetting.mockResolvedValue({});
            mocks.generateReport.mockResolvedValue();

            const { result } = renderHook(() => useReports());
            await waitFor(() => expect(result.current.formLoading).toBe(false));

            // Go to last step (5 is attachments)
            act(() => result.current.setActiveStep(5));

            await act(async () => {
                await result.current.goToNextStep();
            });

            expect(mocks.saveReport).toHaveBeenCalledWith(
                'user-123',
                expect.objectContaining({ status: 'completed' }),
                '123'
            );
            expect(mocks.generateReport).toHaveBeenCalled();
            expect(mocks.navigate).toHaveBeenCalledWith('/reports');
        });
    });
});
