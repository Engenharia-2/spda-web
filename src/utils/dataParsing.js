
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
