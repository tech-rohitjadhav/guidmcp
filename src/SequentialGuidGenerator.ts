/**
 * Sequential GUID Generator optimized for SQL Server
 * 
 * This implementation creates GUIDs that are sequential, which significantly improves
 * SQL Server performance by reducing page splits and index fragmentation.
 * 
 * The format follows SQL Server's NEWSEQUENTIALID() pattern:
 * - First 8 bytes: Sequential (timestamp + machine identifier)
 * - Last 8 bytes: Random
 */

import { randomBytes } from 'crypto';

export interface GuidGeneratorOptions {
    /**
     * Custom machine identifier (4 bytes). If not provided, will be generated randomly.
     */
    machineId?: Buffer;

    /**
     * Custom epoch for timestamp generation. Defaults to Unix epoch.
     */
    epoch?: Date;
}

export class SequentialGuidGenerator {
    private static readonly EPOCH = new Date('1900-01-01T00:00:00Z');
    private static readonly TICKS_PER_MILLISECOND = 10000;
    
    private readonly machineId: Buffer;
    private readonly epoch: Date;
    private lastTimestamp: number = 0;
    private sequence: number = 0;

    constructor(options: GuidGeneratorOptions = {}) {
        this.machineId = options.machineId || this.generateMachineId();
        this.epoch = options.epoch || SequentialGuidGenerator.EPOCH;
        
        if (this.machineId.length !== 4) {
            throw new Error('Machine ID must be exactly 4 bytes');
        }
    }

    /**
     * Generates a new sequential GUID
     */
    public generate(): string {
        const now = Date.now();
        const timestamp = this.getTimestamp(now);
        const guid = Buffer.alloc(16);

        // First 6 bytes: Timestamp (big-endian)
        guid.writeUInt32BE(timestamp >>> 16, 0);
        guid.writeUInt16BE(timestamp & 0xFFFF, 4);

        // Next 2 bytes: Machine ID + Sequence
        guid.writeUInt16BE((this.machineId.readUInt16BE(0) & 0xFFF0) | (this.sequence & 0x000F), 6);

        // Last 2 bytes of machine ID
        guid.writeUInt16BE(this.machineId.readUInt16BE(2), 8);

        // Last 6 bytes: Random
        const randomPart = randomBytes(6);
        randomPart.copy(guid, 10);

        // Format as GUID string
        return this.formatGuid(guid);
    }

    /**
     * Generates multiple sequential GUIDs efficiently
     */
    public generateBatch(count: number): string[] {
        if (count <= 0) {
            throw new Error('Count must be a positive number');
        }

        const guids: string[] = [];
        for (let i = 0; i < count; i++) {
            guids.push(this.generate());
        }
        return guids;
    }

    /**
     * Returns the current machine ID being used
     */
    public getMachineId(): string {
        return this.machineId.toString('hex').toUpperCase();
    }

    /**
     * Validates if a string is a properly formatted GUID
     */
    public static isValidGuid(guid: string): boolean {
        const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return guidRegex.test(guid);
    }

    /**
     * Converts a GUID string to buffer for analysis
     */
    public static guidToBuffer(guid: string): Buffer {
        if (!this.isValidGuid(guid)) {
            throw new Error('Invalid GUID format');
        }

        const cleanGuid = guid.replace(/-/g, '');
        return Buffer.from(cleanGuid, 'hex');
    }

    /**
     * Extracts timestamp information from a sequential GUID
     */
    public extractTimestamp(guid: string): Date {
        const buffer = this.guidToBuffer(guid);
        
        // Read timestamp (first 6 bytes)
        const timestampHigh = buffer.readUInt32BE(0);
        const timestampLow = buffer.readUInt16BE(4);
        const timestamp = (timestampHigh << 16) | timestampLow;
        
        const millisecondsSinceEpoch = timestamp / SequentialGuidGenerator.TICKS_PER_MILLISECOND;
        return new Date(this.epoch.getTime() + millisecondsSinceEpoch);
    }

    private getTimestamp(now: number): number {
        const milliseconds = now - this.epoch.getTime();
        const ticks = Math.floor(milliseconds * SequentialGuidGenerator.TICKS_PER_MILLISECOND);
        
        // Handle sequence overflow within the same millisecond
        if (ticks === this.lastTimestamp) {
            this.sequence = (this.sequence + 1) & 0x000F;
            if (this.sequence === 0) {
                // Sequence overflow, wait for next millisecond
                while (Date.now() <= now) {
                    // Busy wait
                }
                return this.getTimestamp(Date.now());
            }
        } else {
            this.sequence = 0;
        }
        
        this.lastTimestamp = ticks;
        return ticks;
    }

    private generateMachineId(): Buffer {
        const id = Buffer.alloc(4);
        randomBytes(4).copy(id);
        return id;
    }

    private formatGuid(buffer: Buffer): string {
        const parts = [
            buffer.toString('hex', 0, 4),
            buffer.toString('hex', 4, 6),
            buffer.toString('hex', 6, 8),
            buffer.toString('hex', 8, 10),
            buffer.toString('hex', 10, 16)
        ];
        
        return parts.map(part => part.toUpperCase()).join('-');
    }

    private guidToBuffer(guid: string): Buffer {
        return SequentialGuidGenerator.guidToBuffer(guid);
    }
}

/**
 * Default singleton instance for convenience
 */
export const defaultGuidGenerator = new SequentialGuidGenerator();

/**
 * Convenience functions using the default instance
 */
export function generateSequentialGuid(): string {
    return defaultGuidGenerator.generate();
}

export function generateSequentialGuidBatch(count: number): string[] {
    return defaultGuidGenerator.generateBatch(count);
}

export function isValidGuid(guid: string): boolean {
    return SequentialGuidGenerator.isValidGuid(guid);
}
