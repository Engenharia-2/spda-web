class SerialService {
    constructor() {
        this.port = null;
        this.reader = null;
        this.writer = null;
        this.encoder = new TextEncoder();
        this.decoder = new TextDecoder();
        this.isConnected = false;
        this.onDataReceived = null; // Callback for incoming data
    }

    /**
     * Checks if Web Serial API is supported
     */
    isSupported() {
        return "serial" in navigator;
    }

    /**
     * Request a port and open connection
     * @param {number} baudRate 
     */
    async connect(baudRate = 115200) {
        if (!this.isSupported()) {
            throw new Error("Web Serial API not supported in this browser.");
        }

        try {
            this.port = await navigator.serial.requestPort();
            await this.port.open({ baudRate });

            this.isConnected = true;
            this.readLoop(); // Start reading loop
            return true;
        } catch (error) {
            console.error("Error connecting to serial port:", error);
            throw error;
        }
    }

    /**
     * Disconnects from the serial port
     */
    async disconnect() {
        this.isConnected = false; // Signal loop to stop

        if (this.reader) {
            await this.reader.cancel();
            // reader.releaseLock() is handled in readLoop finally block
        }

        if (this.writer) {
            this.writer.releaseLock();
        }

        if (this.port) {
            await this.port.close();
            this.port = null;
        }
    }

    /**
     * Sends text data to the device
     * @param {string} data 
     */
    async send(data) {
        if (!this.port || !this.port.writable) {
            throw new Error("Port not writable or not connected");
        }

        const writer = this.port.writable.getWriter();
        try {
            await writer.write(this.encoder.encode(data));
        } finally {
            writer.releaseLock();
        }
    }

    /**
     * Sends binary data (Uint8Array) to the device
     * @param {Uint8Array} data 
     */
    async sendBinary(data) {
        if (!this.port || !this.port.writable) {
            throw new Error("Port not writable or not connected");
        }

        const writer = this.port.writable.getWriter();
        try {
            await writer.write(data);
        } finally {
            writer.releaseLock();
        }
    }

    /**
     * Internal loop to read data from the port
     */
    async readLoop() {
        while (this.port && this.port.readable && this.isConnected) {
            this.reader = this.port.readable.getReader();
            try {
                while (true) {
                    const { value, done } = await this.reader.read();
                    if (done) {
                        // Reader has been canceled.
                        break;
                    }
                    if (value) {
                        const text = this.decoder.decode(value);
                        if (this.onDataReceived) {
                            this.onDataReceived(text, value);
                        }
                    }
                }
            } catch (error) {
                console.error("Error reading from serial port:", error);
            } finally {
                this.reader.releaseLock();
            }
        }
    }

    /**
     * Set callback for received data
     * @param {function} callback (text, rawValue) => void
     */
    setCallback(callback) {
        this.onDataReceived = callback;
    }
}

export const serialService = new SerialService();
