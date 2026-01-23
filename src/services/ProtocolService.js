class ProtocolService {
    calculateCRC(buffer) {
        let crc = 0xFFFF;
        for (let i = 0; i < buffer.length; i++) {
            crc ^= buffer[i];
            for (let j = 0; j < 8; j++) {
                if (crc & 0x0001) {
                    crc = (crc >> 1) ^ 0xA001;
                } else {
                    crc = crc >> 1;
                }
            }
        }
        crc ^= 0xFFFF; // Final XOR as per user's C code
        return crc;
    }

    /**
     * Builds a packet according to structure:
     * Command (1 byte) | DataSize (2 bytes, LE) | Data (N bytes) | CRC (2 bytes, LE)
     * Note: Assuming Little Endian for Size and CRC based on common practices, 
     * but this might need adjustment if device is Big Endian.
     */
    buildPacket(command, data = []) {
        // Ensure data is Uint8Array
        const dataBytes = data instanceof Uint8Array ? data : new Uint8Array(data);
        const dataSize = dataBytes.length;

        // Total size: 1 (Cmd) + 2 (Size) + N (Data) + 2 (CRC)
        const packetSize = 1 + 2 + dataSize + 2;
        const buffer = new ArrayBuffer(packetSize);
        const view = new DataView(buffer);
        const uint8View = new Uint8Array(buffer);

        // 1. Command
        view.setUint8(0, command);

        // 2. DataSize (Little Endian)
        view.setUint16(1, dataSize, true);

        // 3. Data
        uint8View.set(dataBytes, 3);

        // Calculate CRC over Cmd + Size + Data
        const contentForCRC = uint8View.slice(0, 3 + dataSize);
        const crc = this.calculateCRC(contentForCRC);

        // 4. CRC (Little Endian)
        view.setUint16(3 + dataSize, crc, true);

        return uint8View;
    }

    /**
     * Validates a packet
     */
    validatePacket(buffer) {
        if (buffer.length < 5) return false; // Min size: 1+2+0+2 = 5

        const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        const dataSize = view.getUint16(1, true);

        if (buffer.length !== 1 + 2 + dataSize + 2) return false;

        const receivedCRC = view.getUint16(3 + dataSize, true);
        const contentForCRC = buffer.slice(0, 3 + dataSize);
        const calculatedCRC = this.calculateCRC(contentForCRC);

        return receivedCRC === calculatedCRC;
    }
    /**
     * Parses the payload of an ID_Get response
     * Payload structure: Family(2), Type(2), Serial(4), HW_Ver(3), FW_Ver(3)
     */
    parseDeviceInfo(payload) {
        if (payload.length < 14) return null;

        const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);

        const family = view.getUint16(0, true);
        const type = view.getUint16(2, true);
        const serialNumber = view.getUint32(4, true);

        // Versions: 3 bytes each (Major, Minor, Patch)
        const hwVersion = Array.from(payload.slice(8, 11)).join('.');
        const fwVersion = Array.from(payload.slice(11, 14)).join('.');

        return {
            family,
            type,
            serialNumber,
            hwVersion,
            fwVersion
        };
    }

    /**
     * Identifies the device based on Family and Type
     */
    identifyDevice(family, type) {
        if (family === 0x0001 && type === 0x0002) {
            return "LRM-02";
        }
        return "Desconhecido";
    }

    // Result_Get Helpers
    buildResultGetCount() {
        return this.buildPacket(COMMANDS.RESULT_GET, [SUBCOMMANDS.GET_MEASUREMENT_COUNT]);
    }

    buildResultGetPacketCount(measurementIndex) {
        const data = new Uint8Array(3);
        data[0] = SUBCOMMANDS.GET_PACKET_COUNT;
        const view = new DataView(data.buffer);
        view.setUint16(1, measurementIndex, true); // Little Endian
        return this.buildPacket(COMMANDS.RESULT_GET, data);
    }

    buildResultGetData(measurementIndex, packetIndex) {
        const data = new Uint8Array(4);
        data[0] = SUBCOMMANDS.GET_PACKET_DATA;
        const view = new DataView(data.buffer);
        view.setUint16(1, measurementIndex, true); // Little Endian
        data[3] = packetIndex;
        return this.buildPacket(COMMANDS.RESULT_GET, data);
    }

    parseResultGetCount(payload) {
        if (payload.length < 2) return 0;
        const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
        return view.getUint16(1, true);
    }

    parseResultGetPacketCount(payload) {
        if (payload.length < 6) return 0;
        const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
        return view.getUint8(5, true);
    }

    parseResultGetResultID(payload) {
        if (payload.length < 6) return 0;
        const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
        return view.getUint32(1, true);
    }
}

export const COMMANDS = {
    ID_GET: 0x00,
    RESULT_GET: 0x02
};

export const SUBCOMMANDS = {
    GET_MEASUREMENT_COUNT: 0x00,
    GET_PACKET_COUNT: 0x01,
    GET_PACKET_DATA: 0x02
};

export const protocolService = new ProtocolService();
