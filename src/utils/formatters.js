
// src/utils/formatters.js

export const formatUnit = (value, unit) => {
    if (value === undefined || value === null || value === '') return '-';
    if (typeof value === 'string' && isNaN(parseFloat(value))) return value;

    const num = parseFloat(value);
    if (isNaN(num)) return value;
    if (num === 0) return `0 ${unit}`;

    const absNum = Math.abs(num);

    if (absNum >= 1e6) return `${(num / 1e6).toFixed(2)} M${unit}`;
    if (absNum >= 1e3) return `${(num / 1e3).toFixed(2)} k${unit}`;
    if (absNum >= 1) return `${num.toFixed(2)} ${unit}`;
    if (absNum >= 1e-3) return `${(num * 1e3).toFixed(2)} m${unit}`;
    if (absNum >= 1e-6) return `${(num * 1e6).toFixed(2)} µ${unit}`;

    return `${num} ${unit}`;
};
