export const STORAGE_LIMITS = {
    FREE: 10 * 1024 * 1024, // 10MB
    PRO: 50 * 1024 * 1024   // 50MB
};

export const getStorageLimit = (subscription) => {
    if (subscription === 'pro' || subscription === 'trial') {
        return STORAGE_LIMITS.PRO;
    }
    return STORAGE_LIMITS.FREE;
};
