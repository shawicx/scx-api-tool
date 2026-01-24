# Tasks: Update Documentation to Match Actual Implementation

## Task 1: Update CLI Command Documentation

**File**: `docs/guides/cli.md`

**Changes**:

- [x] Update command overview table with accurate descriptions
- [x] Add `--host` option to visualize command documentation
- [x] Update version output example from 0.4.8 to 0.4.10
- [x] Fix console output examples to match actual progress manager format
- [x] Update watch mode initialization and re-generation messages
- [x] Correct step completion message format (include duration in ms or s)
- [x] Update error handling section with actual error codes

**Validation**:

- Compare all console output examples with actual command output
- Verify all options listed match `--help` output

**Dependencies**: None

---

## Task 2: Update Configuration Documentation

**File**: `docs/guides/configuration.md`

**Changes**:

- [x] Add `requestMethodsObjectName` to request function configuration options table
- [x] Add `requestParamName` to request function configuration options table
- [x] Add `responseTypeName` to request function configuration options table
- [x] Verify all default values match implementation in `src/utils/config.ts`
- [x] Update `typesFormat` description to clarify TypeScript vs Zod mode differences
- [x] Verify preset configurations match `PRESETS` constant in `src/types/config.ts`
- [x] Update `namingStrategy` documentation with accurate function signatures
- [x] Correct any type descriptions that don't match actual `ApiConfig` interface
- [x] Update `concurrency` default value from `5` to `50`

**Validation**:

- Cross-reference with `src/types/config.ts` for all configuration options
- Verify default values against `defineConfig` implementation

**Dependencies**: None

---

## Task 3: Update Examples Documentation - File Structure

**File**: `docs/guides/examples.md`

**Changes**:

- [x] Update Zod mode file structure to show correct schema file locations
- [x] Update TypeScript mode file structure to match actual output
- [x] Use actual category directory names (e.g., `AIFuWu`, `YongHuGuanLi`) or generic names
- [x] Correct `schemas/` directory naming (not `types/` in Zod mode)
- [x] Update import paths to match actual generated code

**Validation**:

- Inspect actual `src/service/` directory structure
- Verify all file paths in examples exist in actual output

**Dependencies**: None

---

## Task 4: Update Examples Documentation - Generated Code

**File**: `docs/guides/examples.md`

**Changes**:

- [x] Update Zod schema file examples with correct structure
- [x] Fix interface function examples to use correct imports and parameter names
- [x] Update type derivation examples (`z.infer<typeof Schema>`)
- [x] Correct schema export naming conventions (e.g., `CompletionRequestDtoSchema`)
- [x] Update TypeScript mode examples with correct interface definitions
- [x] Fix all code snippets to use actual generated code patterns
- [x] Update comparison table for file count, typesFormat, etc.
- [x] Remove API function generation examples from Zod mode section
- [x] Update comparison table to reflect actual behavior (no API functions generated in Zod mode)

**Validation**:

- Compare with actual generated files in `src/service/`
- Run a test generation and verify examples match output

**Dependencies**: Task 3 (file structure must be correct first)

---

## Task 5: Update Quick Start Guide

**File**: `docs/getting-started/quick-start.md`

**Changes**:

- [x] Update console output to show correct progress messages
- [x] Fix generated file structure to match actual output
- [x] Update type definition examples
- [x] Correct request function examples with proper parameter names
- [x] Update main entry file export examples
- [x] Verify React, Vue, Node.js usage examples use correct imports

**Validation**:

- Walk through quick start steps using actual tool
- Verify all code snippets work with generated output

**Dependencies**: None

---

## Task 6: Update Advanced Documentation

**File**: `docs/guides/advanced.md`

**Changes**:

- [x] Verify hooks lifecycle documentation matches actual implementation
- [x] Update watch mode output example with correct messages
- [x] Fix any command references that might be outdated
- [x] Verify environment variable examples work correctly
- [x] Update CI/CD examples with actual command syntax

**Validation**:

- Test hooks functionality with sample configuration
- Verify watch mode behavior matches documentation

**Dependencies**: None

---

## Task 7: Verify and Cross-Reference All Documentation

**All Files**: `docs/**/*.md`

**Changes**:

- [x] Check for version number inconsistencies (search for "0.4.x")
- [x] Verify all import paths use `@scxfe/api-tool` consistently
- [x] Cross-reference configuration options across all files
- [x] Ensure CLI command names are consistent (`api-power` vs `npx api-power`)
- [x] Verify all code snippets are syntactically correct
- [x] Check for any TODO or FIXME comments in documentation

**Validation**:

- Search for version strings across all docs
- Run grep for common terms to ensure consistency
- Read through all documentation files for coherence

**Dependencies**: Tasks 1-6 (must have updated individual sections first)

---

## Task 8: Create Documentation Validation Checklist

**File**: `AGENTS.md` (or new `docs/VALIDATION.md`)

**Changes**:

- [x] Add checklist for keeping documentation synchronized
- [x] Document process for verifying documentation examples
- [x] Add note about running CLI commands to capture output
- [x] List files to update when implementation changes

**Validation**:

- Review checklist with team members
- Ensure checklist is actionable and clear

**Dependencies**: Task 7 (must have completed documentation updates first)

---

## Task 9: Review and Finalize

**All Files**: Documentation files

**Changes**:

- [x] Final review of all changed documentation
- [x] Fix any inconsistencies found during review
- [x] Ensure all links between documentation pages work
- [x] Verify code formatting in examples
- [x] Check for spelling and grammar issues

**Validation**:

- Build documentation site (if applicable)
- Manual review of all changes
- Cross-check with actual implementation one final time

**Dependencies**: All previous tasks

---

## Task 10: Apply Documentation Updates

**Action**: Execute file updates

**Changes**:

- [x] Apply all changes from tasks 1-9
- [x] Commit changes with appropriate commit message
- [x] Verify no unintended changes were made

**Validation**:

- Run `pnpm run lint:fix` to ensure code formatting
- Check git diff for unintended changes

**Dependencies**: Task 9 (review complete)

---
