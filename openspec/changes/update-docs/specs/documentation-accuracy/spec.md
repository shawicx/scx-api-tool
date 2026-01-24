# Spec: Documentation Accuracy

## MODIFIED Requirements

### Requirement: Documentation MUST accurately reflect actual CLI command output and options

Documentation for CLI commands MUST match the actual behavior of the `api-power` CLI tool, including command syntax, options, output messages, and error handling.

#### Scenario: User reads init command documentation and runs command

**Given** the user reads the `api-power init` command documentation
**When** they run `npx api-power init --help`
**Then** the documented options (`--force`, `--verbose`) should match the actual help output
**And** the command description should be identical

#### Scenario: User reads generate command documentation and runs the command

**Given** the user reads the `api-power generate` command documentation
**When** they run `npx api-power generate --help`
**Then** the documented options (`--config`, `--watch`, `--verbose`) should match the actual help output
**And** all option aliases should be documented (e.g., `gen` alias for `generate`)

#### Scenario: User reads debug command documentation and expects verbose output

**Given** the user reads the `api-power debug` command documentation
**When** they run `npx api-power debug`
**Then** the documented behavior (verbose mode enabled by default) should match the actual behavior
**And** the output should include debug-level messages as described

#### Scenario: User reads visualize command documentation and expects host option

**Given** the user reads the `api-power visualize` command documentation
**When** they run `npx api-power viz --help`
**Then** the `--host` option should be documented
**And** the default value (`localhost`) should be specified

#### Scenario: User generates code and sees output matching documentation

**Given** the user reads the code generation output examples in the documentation
**When** they run `npx api-power generate` with a valid configuration
**Then** the console output should match the documented format:

- Step completion messages include step numbers (e.g., "步骤 1/4 完成: ...")
- Duration is shown in milliseconds or seconds (e.g., "(123ms)" or "(2s)")
- Final success message shows the total duration

---

### Requirement: Documentation MUST accurately describe all configuration options

All configuration options documented in the configuration guide MUST exist in the actual `defineConfig` function, with correct types, default values, and descriptions.

#### Scenario: User uses default configuration values

**Given** the user creates a configuration file using only the required options
**When** they run `npx api-power generate`
**Then** all the default values listed in the documentation should be applied
**And** the generated output should match the documented default behavior

#### Scenario: User configures request function naming

**Given** the user reads the request function configuration documentation
**When** they set `requestMethodsObjectName` in their configuration
**Then** the generated code should use this name for the request methods object
**And** the documentation should list this option with its default value

#### Scenario: User applies preset configurations

**Given** the user selects a preset (`minimal`, `standard`, or `verbose`)
**When** they run code generation
**Then** the applied configuration should match the preset documentation
**And** any preset-specific options should be clearly documented

#### Scenario: User uses typesFormat option

**Given** the user reads the typesFormat documentation
**When** they set `typesFormat: 'zod'` or `typesFormat: 'typescript'`
**Then** the generated code structure should match the documented differences
**And** the pros/cons comparison table should accurately describe each mode

---

### Requirement: Documentation MUST show accurate generated code examples

All code examples in the documentation MUST match the actual output of the code generator, including file structure, naming conventions, import paths, and code patterns.

#### Scenario: User generates Zod mode code and compares with examples

**Given** the user sets `typesFormat: 'zod'` in their configuration
**When** they run `npx api-power generate`
**Then** the generated file structure should match the Zod mode documentation:

- Category directories contain `index.ts` (API functions) and `schema.ts` (merged schemas)
- The global `schemas/` directory contains individual schema files (e.g., `UserSchema.ts`)
- Schema files export both the schema (`export const UserSchema = ...`) and derived types (`export type User = z.infer<typeof UserSchema>`)

#### Scenario: User generates TypeScript mode code and compares with examples

**Given** the user sets `typesFormat: 'typescript'` in their configuration
**When** they run `npx api-power generate`
**Then** the generated file structure should match the TypeScript mode documentation:

- Type definitions are embedded in category-specific files
- Types are exported as interfaces or types directly
- Import paths match the documented patterns

#### Scenario: User follows quick start examples

**Given** the user follows the quick start guide step by step
**When** they complete the process
**Then** all the generated code should match the examples shown
**And** the file structure should be identical to the documented tree view
**And** the usage examples (React, Vue, Node.js) should work with the actual generated code

#### Scenario: User uses generated code in a project

**Given** the user imports generated types and functions as shown in the examples
**When** they write code using these imports
**Then** the TypeScript types should match the documentation
**And** the function signatures should be accurate
**And** all imports should resolve correctly

---

### Requirement: Documentation MUST be consistent across all files

All documentation MUST use consistent terminology, formatting, version numbers, and code styles across all markdown files.

#### Scenario: User reads multiple documentation files

**Given** the user reads multiple documentation pages
**When** they compare information across pages
**Then** CLI command names should be consistent (e.g., always `api-power` or always `npx api-power`)
**And** Configuration option names should match across all files
**And** Version numbers should be current (e.g., 0.4.10, not 0.4.8)
**And** Import paths should be consistent (`@scxfe/api-tool`)

#### Scenario: User follows links between documentation pages

**Given** the user clicks on internal documentation links
**When** they navigate to the linked sections
**Then** the linked content should exist and be relevant
**And** any cross-references should be accurate
**And** all example code should be contextually appropriate

---

### Requirement: Documentation MUST include accurate error messages and troubleshooting

All error messages, debugging information, and troubleshooting steps in the documentation MUST match the actual behavior of the tool.

#### Scenario: User encounters a configuration error

**Given** the user makes a mistake in their configuration file
**When** they run `npx api-power generate`
**Then** the error message should match the documented error format
**And** the troubleshooting steps should lead to a resolution

#### Scenario: User uses debug command

**Given** the user runs `npx api-power debug`
**When** the command executes
**Then** the debug output should match the documented format
**And** all debug information categories should be present

#### Scenario: User has network issues

**Given** the user has network connectivity problems
**When** they run code generation
**Then** the error messages should be helpful and match the documentation
**And** the troubleshooting section should cover this scenario
