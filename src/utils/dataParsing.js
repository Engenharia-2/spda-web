
// src/utils/dataParsing.js

export const parseCustomFormat = (text) => {
    const headerRegex = /^G(\d+)\[(\d+)\/(\d+)\]:/;
    const match = text.match(headerRegex);
    if (!match) return null;

    const [, groupId, partIndex, totalParts] = match;
    const content = text.substring(match[0].length);

    return {
        groupId: `G${groupId}`,
        partIndex: parseInt(partIndex),
        totalParts: parseInt(totalParts),
        content
    };
};

export const parseMeasurementPoint = (pointStr) => {
    const regex = /^P(\d+)=([\d,]+)(m?),([\d.]+)(?:,(\d{6}),(\d{4}))?/;
    const match = pointStr.match(regex);
    if (!match) return null;

    const [, pointId, resValue, resUnit, current, dateStr, timeStr] = match;

    let resistance = parseFloat(resValue.replace(',', '.'));
    if (resUnit === 'm') {
        resistance = resistance / 1000;
    }

    let dateTime = null;
    if (dateStr && timeStr) {
        const day = dateStr.substring(0, 2);
        const month = dateStr.substring(2, 4);
        const year = `20${dateStr.substring(4, 6)}`;
        const hour = timeStr.substring(0, 2);
        const minute = timeStr.substring(2, 4);
        dateTime = `${day}/${month}/${year} ${hour}:${minute}`;
    }

    return {
        ponto: parseInt(pointId),
        resistencia: resistance,
        corrente: parseFloat(current),
        dataHora: dateTime
    };
};

// Helper to format resistance
export const formatResistance = (val) => {
    if (val === undefined || val === null || val === '') return '-';
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    if (num < 1 && num !== 0) {
        return `${Math.round(num * 1000)} mOhms`;
    }
    return `${num.toFixed(3)} Ohms`;
};

// Helper to extract date/time
export const extractMeasurementDateTime = (measurements) => {
    if (!measurements?.parsedData || measurements.parsedData.length === 0) {
        return { date: 'Não Informado', startTime: 'Não Informado', endTime: 'Não Informado' };
    }
    const first = measurements.parsedData[0];
    const last = measurements.parsedData[measurements.parsedData.length - 1];

    const parse = (str) => {
        if (!str) return { date: '', time: '' };
        const parts = str.split(' ');
        return { date: parts[0] || '', time: parts[1] || '' };
    };

    const start = parse(first.dataHora);
    const end = parse(last.dataHora);

    return {
        date: start.date || 'Não Informado',
        startTime: start.time || 'Não Informado',
        endTime: end.time || 'Não Informado'
    };
};

export const parseBinaryMeasurement = (uint8Array) => {
    if (uint8Array.length % 16 !== 0) {
        console.error("Binary data length is not a multiple of 16.");
        return [];
    }

    const measurements = [];
    const view = new DataView(uint8Array.buffer, uint8Array.byteOffset, uint8Array.byteLength);

    for (let i = 0; i < uint8Array.length; i += 16) {
        const group = view.getUint8(i + 0);
        const point = view.getUint8(i + 1);

        // Assuming Little Endian based on data.txt analysis
        const resistance = view.getFloat32(i + 2, true);
        const current = view.getFloat32(i + 6, true);

        const hour = view.getUint8(i + 10);
        const minute = view.getUint8(i + 11);
        const second = view.getUint8(i + 12);
        const day = view.getUint8(i + 13);
        const month = view.getUint8(i + 14);
        const year = 2000 + view.getUint8(i + 15);

        const timestamp = new Date(year, month - 1, day, hour, minute, second);

        measurements.push({
            group,
            point,
            resistance,
            current,
            timestamp
        });
    }

    return measurements;
};
