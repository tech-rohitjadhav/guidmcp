# GUIDMCP Project Rules

This file contains project-specific rules and guidelines for Claude Code and other AI assistants to follow when working on this project.

## Git Commit Guidelines

### 🚫 IMPORTANT: No AI Attribution
- **DO NOT include "Claude Code", "Generated with Claude Code", or any AI tool references in git commit messages**
- Commit messages should be clean and professional without mentioning AI assistance
- Focus on what was changed, not who or what made the change

### Commit Message Format
- **Use standard commit message format** - Follow conventional commit specification
- Format: `<type>(<scope>): <description>`
- **Required types:**
  - `feat:` for new features
  - `fix:` for bug fixes
  - `docs:` for documentation changes
  - `style:` for code formatting changes (no functional changes)
  - `refactor:` for code refactoring
  - `perf:` for performance improvements
  - `test:` for test changes
  - `build:` for build system changes
  - `ci:` for CI/CD changes
  - `chore:` for maintenance tasks
- Keep subject line under 50 characters
- Use imperative mood ("add feature" not "added feature")
- Separate body from subject with blank line if body is needed
- Keep commit messages concise but informative

## Development Guidelines

### Code Style
- Follow existing TypeScript patterns and conventions
- Use proper TypeScript types for all functions and variables
- Maintain consistent naming conventions (camelCase for variables, PascalCase for classes)
- Add JSDoc comments for public APIs and complex logic

### SQL Server Optimization
- Always consider SQL Server performance implications
- Sequential GUIDs must remain optimized for NEWSEQUENTIALID() compatibility
- Preserve the performance benefits in any optimizations or changes
- Test changes with SQL Server workloads when possible

### Testing
- Add comprehensive tests for new functionality
- Test both sequential and random GUID generation
- Include edge cases and error conditions
- Maintain test coverage above 90%

### Documentation
- Update README.md for user-facing changes
- Update inline documentation for API changes
- Include performance implications in documentation
- Add examples for new features

## MCP Server Specific Rules

### Tool Implementation
- MCP tools must have proper input validation
- Return structured, helpful responses
- Include performance characteristics in tool responses
- Maintain backward compatibility when possible

### Error Handling
- Use appropriate MCP error codes
- Provide clear error messages
- Handle invalid input gracefully
- Never expose internal implementation details in errors

## Project Structure

### File Organization
- Keep core GUID logic in `SequentialGuidGenerator.ts`
- SQL Server optimizations in `SqlServerOptimizations.ts`
- MCP server logic in `server.ts`
- Tests in appropriate test files

### Dependencies
- Minimal dependencies preferred
- Prefer built-in Node.js modules when possible
- Ensure dependencies are secure and maintained

## Security Considerations

- GUID generation must be cryptographically secure where appropriate
- No predictable patterns that could create security vulnerabilities
- Proper input validation to prevent injection attacks
- Secure random number generation for random GUIDs

## Performance Requirements

- Sequential GUID generation must maintain high performance
- Batch generation should be efficient for large counts
- Memory usage should remain reasonable
- SQL Server optimization benefits must be preserved

---

**Remember**: This project focuses on SQL Server performance optimization. Every change should maintain or improve the performance benefits that sequential GUIDs provide over random GUIDs in SQL Server environments.