import { vi } from 'vitest';

const {
    mockSaveReport,
    mockGetUserReports,
    mockGetReport,
    mockDeleteReport,
    mockUploadImage,
    mockResolveImageUrl
} = vi.hoisted(() => ({
    mockSaveReport: vi.fn(),
    mockGetUserReports: vi.fn(),
    mockGetReport: vi.fn(),
    mockDeleteReport: vi.fn(),
    mockUploadImage: vi.fn(),
    mockResolveImageUrl: vi.fn()
}));

vi.mock('../../../services/StorageService', () => ({
    StorageService: {
        saveReport: mockSaveReport,
        getUserReports: mockGetUserReports,
        getReport: mockGetReport,
        deleteReport: mockDeleteReport,
        uploadImage: mockUploadImage,
        resolveImageUrl: mockResolveImageUrl
    }
}));

export {
    mockSaveReport,
    mockGetUserReports,
    mockGetReport,
    mockDeleteReport,
    mockUploadImage,
    mockResolveImageUrl
};
