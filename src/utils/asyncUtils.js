/**
 * Wraps a Promise with a timeout.
 * @param {Promise} promise The promise to wrap.
 * @param {number} ms The timeout in milliseconds.
 * @returns {Promise} A new promise that will reject if the original promise doesn't resolve/reject within the given time.
 */
export const withTimeout = (promise, ms = 10000) => {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error(`Operação excedeu o tempo limite de ${ms}ms.`));
        }, ms);

        promise
            .then(res => {
                clearTimeout(timeoutId);
                resolve(res);
            })
            .catch(err => {
                clearTimeout(timeoutId);
                reject(err);
            });
    });
};
