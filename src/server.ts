#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import {
  SequentialGuidGenerator,
  generateSequentialGuid,
  generateSequentialGuidBatch,
  isValidGuid,
  defaultGuidGenerator,
} from './SequentialGuidGenerator.js';
import { SqlServerOptimizations } from './SqlServerOptimizations.js';

/**
 * MCP Server for Sequential GUID Generation
 * 
 * This server provides tools for generating SQL Server optimized sequential GUIDs,
 * which improve database performance by reducing index fragmentation.
 */

class GuidMcpServer {
  private server: Server;
  private guidGenerator: SequentialGuidGenerator;

  constructor() {
    this.server = new Server(
      {
        name: 'sequential-guid-generator',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.guidGenerator = defaultGuidGenerator;
    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'generate_sequential_guid',
            description: 'Generate a single SQL Server optimized sequential GUID',
            inputSchema: {
              type: 'object',
              properties: {
                machineId: {
                  type: 'string',
                  description: 'Optional custom machine ID (8 hex characters). If not provided, uses default.',
                  pattern: '^[0-9A-Fa-f]{8}$',
                },
              },
            },
          },
          {
            name: 'generate_sequential_guid_batch',
            description: 'Generate multiple SQL Server optimized sequential GUIDs',
            inputSchema: {
              type: 'object',
              properties: {
                count: {
                  type: 'number',
                  description: 'Number of GUIDs to generate (1-1000)',
                  minimum: 1,
                  maximum: 1000,
                },
                machineId: {
                  type: 'string',
                  description: 'Optional custom machine ID (8 hex characters). If not provided, uses default.',
                  pattern: '^[0-9A-Fa-f]{8}$',
                },
              },
              required: ['count'],
            },
          },
          {
            name: 'validate_guid',
            description: 'Validate if a string is a properly formatted GUID',
            inputSchema: {
              type: 'object',
              properties: {
                guid: {
                  type: 'string',
                  description: 'GUID string to validate',
                },
              },
              required: ['guid'],
            },
          },
          {
            name: 'extract_guid_timestamp',
            description: 'Extract timestamp information from a sequential GUID',
            inputSchema: {
              type: 'object',
              properties: {
                guid: {
                  type: 'string',
                  description: 'Sequential GUID to extract timestamp from',
                },
              },
              required: ['guid'],
            },
          },
          {
            name: 'get_machine_id',
            description: 'Get the current machine ID being used for GUID generation',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_guid_info',
            description: 'Get detailed information about a GUID including structure and timestamps',
            inputSchema: {
              type: 'object',
              properties: {
                guid: {
                  type: 'string',
                  description: 'GUID to analyze',
                },
              },
              required: ['guid'],
            },
          },
          {
            name: 'analyze_sql_server_impact',
            description: 'Analyze SQL Server performance impact of a GUID',
            inputSchema: {
              type: 'object',
              properties: {
                guid: {
                  type: 'string',
                  description: 'GUID to analyze for SQL Server optimization',
                },
              },
              required: ['guid'],
            },
          },
          {
            name: 'generate_sql_schema',
            description: 'Generate SQL Server table schema optimized for sequential GUIDs',
            inputSchema: {
              type: 'object',
              properties: {
                tableName: {
                  type: 'string',
                  description: 'Name of the table',
                },
                guidColumnName: {
                  type: 'string',
                  description: 'Name of the GUID column (default: Id)',
                },
              },
              required: ['tableName'],
            },
          },
          {
            name: 'get_sql_performance_queries',
            description: 'Get SQL Server performance monitoring queries for GUID tables',
            inputSchema: {
              type: 'object',
              properties: {
                tableName: {
                  type: 'string',
                  description: 'Name of the table to monitor',
                },
                guidColumnName: {
                  type: 'string',
                  description: 'Name of the GUID column (default: Id)',
                },
              },
              required: ['tableName'],
            },
          },
          {
            name: 'get_sql_best_practices',
            description: 'Get SQL Server GUID best practices and optimization guidelines',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_performance_comparison',
            description: 'Get performance comparison between sequential and random GUIDs in SQL Server',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'generate_sequential_guid': {
            let generator = this.guidGenerator;
            
            if (args && typeof args === 'object' && args.machineId && typeof args.machineId === 'string') {
              const machineIdBuffer = Buffer.from(args.machineId, 'hex');
              generator = new SequentialGuidGenerator({ machineId: machineIdBuffer });
            }

            const guid = generator.generate();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    guid,
                    machineId: generator.getMachineId(),
                    timestamp: generator.extractTimestamp(guid).toISOString(),
                    sqlOptimized: true,
                  }, null, 2),
                },
              ],
            };
          }

          case 'generate_sequential_guid_batch': {
            const argsObj = args as any;
            const argsCount = argsObj?.count;
            const machineId = argsObj?.machineId;
            
            if (!argsCount || typeof argsCount !== 'number' || argsCount < 1 || argsCount > 1000) {
              throw new McpError(
                ErrorCode.InvalidParams,
                'Count must be a number between 1 and 1000'
              );
            }

            let generator = this.guidGenerator;
            
            if (machineId) {
              const machineIdBuffer = Buffer.from(machineId, 'hex');
              generator = new SequentialGuidGenerator({ machineId: machineIdBuffer });
            }

            const guids = generator.generateBatch(argsCount);
            const firstTimestamp = generator.extractTimestamp(guids[0]);
            const lastTimestamp = generator.extractTimestamp(guids[guids.length - 1]);

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    guids,
                    count: guids.length,
                    machineId: generator.getMachineId(),
                    firstTimestamp: firstTimestamp.toISOString(),
                    lastTimestamp: lastTimestamp.toISOString(),
                    sqlOptimized: true,
                    note: 'These GUIDs are optimized for SQL Server to reduce index fragmentation',
                  }, null, 2),
                },
              ],
            };
          }

          case 'validate_guid': {
            const argsObj = args as any;
            const guid = argsObj?.guid;
            
            if (!guid) {
              throw new McpError(
                ErrorCode.InvalidParams,
                'GUID parameter is required'
              );
            }

            const isValid = isValidGuid(guid);
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    guid,
                    isValid,
                    message: isValid 
                      ? 'Valid GUID format'
                      : 'Invalid GUID format - expected format: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX',
                  }, null, 2),
                },
              ],
            };
          }

          case 'extract_guid_timestamp': {
            const argsObj = args as any;
            const guid = argsObj?.guid;
            
            if (!guid) {
              throw new McpError(
                ErrorCode.InvalidParams,
                'GUID parameter is required'
              );
            }

            if (!isValidGuid(guid)) {
              throw new McpError(
                ErrorCode.InvalidParams,
                'Invalid GUID format'
              );
            }

            const timestamp = this.guidGenerator.extractTimestamp(guid);
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    guid,
                    timestamp: timestamp.toISOString(),
                    timestampMilliseconds: timestamp.getTime(),
                    age: `${Math.floor((Date.now() - timestamp.getTime()) / 1000)} seconds ago`,
                  }, null, 2),
                },
              ],
            };
          }

          case 'get_machine_id': {
            const machineId = this.guidGenerator.getMachineId();
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    machineId,
                    description: 'Machine identifier used for GUID generation',
                    note: 'This ensures uniqueness across different machines while maintaining sequential order',
                  }, null, 2),
                },
              ],
            };
          }

          case 'get_guid_info': {
            const argsObj = args as any;
            const guid = argsObj?.guid;
            
            if (!guid) {
              throw new McpError(
                ErrorCode.InvalidParams,
                'GUID parameter is required'
              );
            }

            if (!isValidGuid(guid)) {
              throw new McpError(
                ErrorCode.InvalidParams,
                'Invalid GUID format'
              );
            }

            const buffer = SequentialGuidGenerator.guidToBuffer(guid);
            const isValid = isValidGuid(guid);
            
            let timestamp = null;
            let isSequential = false;
            
            try {
              timestamp = this.guidGenerator.extractTimestamp(guid);
              isSequential = true;
            } catch (error) {
              // Not a sequential GUID or timestamp extraction failed
            }

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    guid,
                    isValid,
                    isSequential,
                    structure: {
                      length: guid.length,
                      bytes: buffer.length,
                      hex: buffer.toString('hex').toUpperCase(),
                      parts: {
                        part1: guid.substring(0, 8),
                        part2: guid.substring(9, 13),
                        part3: guid.substring(14, 18),
                        part4: guid.substring(19, 23),
                        part5: guid.substring(24, 36),
                      },
                    },
                    timestamp: timestamp ? {
                      value: timestamp.toISOString(),
                      milliseconds: timestamp.getTime(),
                      age: `${Math.floor((Date.now() - timestamp.getTime()) / 1000)} seconds ago`,
                    } : null,
                    sqlOptimization: {
                      isOptimized: isSequential,
                      benefit: isSequential 
                        ? 'Reduces index fragmentation and improves insert performance in SQL Server'
                        : 'Standard GUID - may cause index fragmentation in SQL Server',
                    },
                  }, null, 2),
                },
              ],
            };
          }

          case 'analyze_sql_server_impact': {
            const argsObj = args as any;
            const guid = argsObj?.guid;
            
            if (!guid) {
              throw new McpError(
                ErrorCode.InvalidParams,
                'GUID parameter is required'
              );
            }

            if (!isValidGuid(guid)) {
              throw new McpError(
                ErrorCode.InvalidParams,
                'Invalid GUID format'
              );
            }

            const analysis = SqlServerOptimizations.analyzeGuid(guid);
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(analysis, null, 2),
                },
              ],
            };
          }

          case 'generate_sql_schema': {
            const argsObj = args as any;
            const tableName = argsObj?.tableName;
            const guidColumnName = argsObj?.guidColumnName || 'Id';
            
            if (!tableName) {
              throw new McpError(
                ErrorCode.InvalidParams,
                'Table name is required'
              );
            }

            const schema = SqlServerOptimizations.generateTableSchema(tableName, guidColumnName);
            
            return {
              content: [
                {
                  type: 'text',
                  text: schema,
                },
              ],
            };
          }

          case 'get_sql_performance_queries': {
            const argsObj = args as any;
            const tableName = argsObj?.tableName;
            const guidColumnName = argsObj?.guidColumnName || 'Id';
            
            if (!tableName) {
              throw new McpError(
                ErrorCode.InvalidParams,
                'Table name is required'
              );
            }

            const queries = SqlServerOptimizations.generatePerformanceQueries(tableName, guidColumnName);
            
            return {
              content: [
                {
                  type: 'text',
                  text: queries,
                },
              ],
            };
          }

          case 'get_sql_best_practices': {
            const bestPractices = SqlServerOptimizations.generateBestPractices();
            
            return {
              content: [
                {
                  type: 'text',
                  text: bestPractices,
                },
              ],
            };
          }

          case 'get_performance_comparison': {
            const comparison = SqlServerOptimizations.generateComparisonReport();
            
            return {
              content: [
                {
                  type: 'text',
                  text: comparison,
                },
              ],
            };
          }

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Sequential GUID MCP Server running on stdio');
  }
}

const server = new GuidMcpServer();
server.run().catch(console.error);
