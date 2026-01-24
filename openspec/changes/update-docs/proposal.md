# Proposal: Update Documentation to Match Actual Implementation

## Summary

This proposal updates all documentation in the `@docs/` directory to accurately reflect the current functionality, configuration options, CLI commands, and actual execution outputs of the `@scx/api-tool` project.

## Motivation

The current documentation contains several inaccuracies and outdated examples that do not match the actual implementation:

1. **CLI command outputs** are inconsistent with the actual console messages from the progress manager
2. **Configuration options** documented differ from the actual `defineConfig` function signature
3. **Generated code examples** don't match the actual file structure and content
4. **Command line options** are missing or incorrectly documented
5. **Version numbers** in examples are outdated (showing 0.4.8 vs actual 0.4.10)

These discrepancies cause user confusion and make it difficult for developers to use the tool effectively.

## Scope

### In-Scope Changes

1. **Update CLI documentation** (`docs/guides/cli.md`):
   - Correct command output examples to match actual console output
   - Add `--host` option for visualize command
   - Update version output example
   - Correct progress message format
   - Update watch mode output example

2. **Update configuration documentation** (`docs/guides/configuration.md`):
   - Add missing config options: `requestMethodsObjectName`
   - Verify all default values match actual implementation
   - Update `preset` descriptions to match actual behavior
   - Correct type descriptions

3. **Update examples documentation** (`docs/guides/examples.md`):
   - Fix generated code structure to match actual output
   - Update file naming conventions (Chinese category names)
   - Correct import paths and type exports
   - Fix Zod schema examples

4. **Update quick start guide** (`docs/getting-started/quick-start.md`):
   - Correct console output examples
   - Update file structure examples
   - Fix generated code examples

5. **Update advanced documentation** (`docs/guides/advanced.md`):
   - Verify hooks examples match actual implementation
   - Update watch mode output
   - Fix any outdated command references

### Out-of-Scope Changes

- Changing the actual implementation to match documentation
- Adding new features or configuration options
- Modifying the build or deployment process
- Creating new documentation sections

## Implementation Approach

The documentation updates will be based on:

1. **Actual CLI command outputs** - Running each command and capturing real console output
2. **Source code verification** - Reading actual implementation files for accurate values
3. **Generated code inspection** - Examining `src/service/` output directory
4. **Type definitions** - Referencing `src/types/` for accurate configuration types

## Dependencies

None - this is a documentation-only change.

## Risks

- **Risk**: Documentation may become stale again if implementation changes.
- **Mitigation**: Add a note to AGENTS.md about keeping documentation synchronized with implementation changes.

## Success Criteria

1. All CLI command output examples match actual console output
2. All configuration options are accurately documented with correct default values
3. All generated code examples match actual file structure and content
4. No outdated version numbers or API references remain
5. Documentation can be validated against actual implementation by running commands

## Open Questions

1. Should we add automated tests to verify documentation examples match actual implementation?
2. Should we document both Zod and TypeScript modes equally, or focus on Zod as the recommended approach?
3. Should the documentation include actual example projects or just code snippets?

## Related Changes

None - this is a standalone documentation update.

## Timeline

- **Estimated effort**: 2-3 hours
- **Risk level**: Low (documentation-only)
- **Validation**: Manual verification by running CLI commands and comparing outputs
