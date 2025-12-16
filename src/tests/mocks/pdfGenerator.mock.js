import { vi } from 'vitest';

const { mockGenerateReport } = vi.hoisted(() => ({
    mockGenerateReport: vi.fn()
}));

vi.mock('../../../utils/PDFGenerator', () => ({
    generateReport: mockGenerateReport
}));

export { mockGenerateReport };
