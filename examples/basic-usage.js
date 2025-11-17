#!/usr/bin/env node

/**
 * Basic usage example for Sequential GUID Generator MCP Server
 */

const { SequentialGuidGenerator } = require('../dist/SequentialGuidGenerator');

console.log('=== Sequential GUID Generator Examples ===\n');

// Create a generator instance
const generator = new SequentialGuidGenerator();

// Example 1: Generate a single GUID
console.log('1. Generate a single GUID:');
const guid = generator.generate();
console.log(`   ${guid}`);
console.log(`   Machine ID: ${generator.getMachineId()}`);
console.log(`   Timestamp: ${generator.extractTimestamp(guid).toISOString()}\n`);

// Example 2: Generate multiple GUIDs
console.log('2. Generate 5 GUIDs in batch:');
const batch = generator.generateBatch(5);
batch.forEach((g, i) => {
  console.log(`   ${i + 1}. ${g}`);
});
console.log('');

// Example 3: Validate GUIDs
console.log('3. GUID validation:');
const testGuids = [
  guid,
  '550e8400-e29b-41d4-a716-446655440000',
  'invalid-guid',
  '00000000-0000-0000-0000-000000000000'
];

testGuids.forEach((testGuid, i) => {
  const isValid = SequentialGuidGenerator.isValidGuid(testGuid);
  console.log(`   ${testGuid.padEnd(40)} ${isValid ? '✅ Valid' : '❌ Invalid'}`);
});

console.log('\n=== SQL Server Optimization Benefits ===');
console.log('• Reduces index fragmentation by up to 90%');
console.log('• Improves insert performance by 3-10x');
console.log('• Better cache locality and lower I/O overhead');
console.log('• Predictable page allocation patterns');

console.log('\n=== Usage in SQL Server ===');
console.log('-- For client-generated GUIDs:');
console.log('INSERT INTO Users (Id, Name, Email) VALUES');
console.log(`  ('${guid}', 'John Doe', 'john@example.com');`);
console.log('');
console.log('-- For server-generated GUIDs:');
console.log('CREATE TABLE Users (');
console.log('    Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Users_Id DEFAULT (NEWSEQUENTIALID()) PRIMARY KEY,');
console.log('    Name NVARCHAR(100) NOT NULL,');
console.log('    Email NVARCHAR(255) NOT NULL');
console.log(');');
