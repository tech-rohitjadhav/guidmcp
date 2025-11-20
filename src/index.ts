/**
 * Sequential GUID Generator MCP
 *
 * A SQL Server optimized sequential GUID generator for improved database performance
 * and reduced index fragmentation.
 *
 * @author GUIDMCP
 * @version 1.0.0
 * @license MIT
 */

export { SequentialGuidGenerator, type GuidGeneratorOptions } from './SequentialGuidGenerator.js';
export { SqlServerOptimizations, type SqlServerGuidAnalysis } from './SqlServerOptimizations.js';
export {
  generateSequentialGuid,
  generateSequentialGuidBatch,
  generateRandomGuid,
  generateRandomGuidBatch,
  isValidGuid,
  defaultGuidGenerator,
} from './SequentialGuidGenerator.js';