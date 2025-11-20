/**
 * Tests for SequentialGuidGenerator
 */

import { SequentialGuidGenerator, generateSequentialGuid, generateSequentialGuidBatch, isValidGuid } from './SequentialGuidGenerator';

describe('SequentialGuidGenerator', () => {
  let generator: SequentialGuidGenerator;

  beforeEach(() => {
    generator = new SequentialGuidGenerator();
  });

  describe('generate', () => {
    it('should generate a valid GUID format', () => {
      const guid = generator.generate();
      expect(isValidGuid(guid)).toBe(true);
      expect(guid).toMatch(/^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i);
    });

    it('should generate unique GUIDs', () => {
      const guids = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        const guid = generator.generate();
        expect(guids.has(guid)).toBe(false);
        guids.add(guid);
      }
      expect(guids.size).toBe(1000);
    });

    it('should generate sequential GUIDs', () => {
      const guid1 = generator.generate();
      const guid2 = generator.generate();
      
      // Sequential GUIDs should have increasing timestamps
      const timestamp1 = generator.extractTimestamp(guid1);
      const timestamp2 = generator.extractTimestamp(guid2);
      
      expect(timestamp2.getTime()).toBeGreaterThanOrEqual(timestamp1.getTime());
    });
  });

  describe('generateBatch', () => {
    it('should generate the requested number of GUIDs', () => {
      const guids = generator.generateBatch(10);
      expect(guids).toHaveLength(10);
      
      // All should be valid
      guids.forEach(guid => {
        expect(isValidGuid(guid)).toBe(true);
      });
    });

    it('should generate unique GUIDs in batch', () => {
      const guids = generator.generateBatch(100);
      const uniqueGuids = new Set(guids);
      expect(uniqueGuids.size).toBe(100);
    });

    it('should throw error for invalid count', () => {
      expect(() => generator.generateBatch(0)).toThrow('Count must be a positive number');
      expect(() => generator.generateBatch(-1)).toThrow('Count must be a positive number');
    });
  });

  describe('extractTimestamp', () => {
    it('should extract timestamp from generated GUID', () => {
      const guid = generator.generate();
      const timestamp = generator.extractTimestamp(guid);

      expect(timestamp).toBeInstanceOf(Date);
      // Should be a reasonable date (after 1900 but before far future)
      expect(timestamp.getTime()).toBeGreaterThan(new Date('1900-01-01').getTime());
      expect(timestamp.getTime()).toBeLessThan(Date.now() + 60000); // Within 1 minute from now
    });

    it('should extract increasing timestamps for sequential GUIDs', () => {
      const guids = generator.generateBatch(5);
      const timestamps = guids.map(guid => generator.extractTimestamp(guid));
      
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i].getTime()).toBeGreaterThanOrEqual(timestamps[i - 1].getTime());
      }
    });
  });

  describe('getMachineId', () => {
    it('should return a valid machine ID', () => {
      const machineId = generator.getMachineId();
      expect(machineId).toMatch(/^[0-9A-F]{8}$/i);
      expect(machineId.length).toBe(8);
    });

    it('should return consistent machine ID', () => {
      const machineId1 = generator.getMachineId();
      const machineId2 = generator.getMachineId();
      expect(machineId1).toBe(machineId2);
    });
  });

  describe('with custom machine ID', () => {
    it('should use custom machine ID', () => {
      const customMachineId = Buffer.from('12345678', 'hex');
      const customGenerator = new SequentialGuidGenerator({ machineId: customMachineId });
      
      expect(customGenerator.getMachineId()).toBe('12345678');
    });

    it('should throw error for invalid machine ID length', () => {
      const invalidMachineId = Buffer.from('1234', 'hex');
      expect(() => new SequentialGuidGenerator({ machineId: invalidMachineId }))
        .toThrow('Machine ID must be exactly 4 bytes');
    });
  });
});

describe('Convenience Functions', () => {
  describe('generateSequentialGuid', () => {
    it('should generate a valid GUID', () => {
      const guid = generateSequentialGuid();
      expect(isValidGuid(guid)).toBe(true);
    });
  });

  describe('generateSequentialGuidBatch', () => {
    it('should generate multiple GUIDs', () => {
      const guids = generateSequentialGuidBatch(5);
      expect(guids).toHaveLength(5);
      guids.forEach(guid => {
        expect(isValidGuid(guid)).toBe(true);
      });
    });
  });
});

describe('isValidGuid', () => {
  it('should validate correct GUID formats', () => {
    const validGuids = [
      '550E8400-E29B-41D4-A716-446655440000',
      '550e8400-e29b-41d4-a716-446655440000',
      '00000000-0000-0000-0000-000000000000',
      'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF'
    ];

    validGuids.forEach(guid => {
      expect(isValidGuid(guid)).toBe(true);
    });
  });

  it('should reject invalid GUID formats', () => {
    const invalidGuids = [
      '',
      'not-a-guid',
      '550E8400E29B41D4A716446655440000', // Missing hyphens
      '550E8400-E29B-41D4-A716-44665544', // Too short
      '550E8400-E29B-41D4-A716-44665544000000', // Too long
      'GGGGGGGG-GGGG-GGGG-GGGG-GGGGGGGGGGGG', // Invalid hex
      '550E8400-E29B-41D4-A716-44665544000Z' // Invalid character
    ];

    invalidGuids.forEach(guid => {
      expect(isValidGuid(guid)).toBe(false);
    });
  });
});
