import { vi } from 'vitest';

const {
    mockGetSetting,
    mockSaveSetting,
    mockGetDefaultChecklist
} = vi.hoisted(() => ({
    mockGetSetting: vi.fn(),
    mockSaveSetting: vi.fn(),
    mockGetDefaultChecklist: vi.fn()
}));

vi.mock('../../../services/SettingsService', () => ({
    SettingsService: {
        getSetting: mockGetSetting,
        saveSetting: mockSaveSetting,
        getDefaultChecklist: mockGetDefaultChecklist
    }
}));

export {
    mockGetSetting,
    mockSaveSetting,
    mockGetDefaultChecklist
};
