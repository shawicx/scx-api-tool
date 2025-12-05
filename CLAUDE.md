# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `@scxfe/api-tool`, a Node.js CLI tool that generates TypeScript/JavaScript code from API definitions in Swagger/OpenAPI 3.0 and Apifox platforms. The tool generates type definitions and HTTP request functions automatically.

## Common Development Commands

```bash
# Development
pnpm install                    # Install dependencies
pnpm run dev                   # Run in development mode with config file
pnpm run build                 # Build for production

# Code Quality
pnpm run lint                  # Run ESLint
pnpm run lint:fix              # Auto-fix linting issues and format code

# Testing & Debugging
npx ts-node src/index.ts       # Test generation and verify output in src/service/
npx api-power init             # Initialize configuration file
npx api-power                  # Generate code using config
npx api-power debug            # Debug configuration and data fetching

# Documentation
pnpm run docs:dev              # Start documentation dev server
pnpm run docs:build            # Build documentation
pnpm run docs:preview          # Preview built documentation

# Release
pnpm run release               # Full release process (build, version, publish)
```

## Architecture Overview

### Core Structure

The project follows a modular architecture with clear separation of concerns:

- **CLI Layer** (`src/cli/`): Command-line interface using Commander.js
  - `program.ts`: Main CLI program setup
  - `commands/`: Individual command implementations (init, generate, debug)

- **Client Layer** (`src/clients/`): API data fetchers for different platforms
  - `apifox.ts`: Apifox API client
  - `swagger.ts`: Swagger/OpenAPI client
  - `index.ts`: Client factory that routes based on `serverType`

- **Generator Layer** (`src/generator/`): Code generation pipeline
  - `index.ts`: Main generation orchestrator
  - `codegen.ts`: File generation logic
  - `extractor.ts`: Data extraction and processing
  - `template.ts`: Template rendering with Handlebars
  - `fileGenerator.ts`: Individual file generation

- **Processors** (`src/processors/`): Data transformation
  - `openapi.ts`: OpenAPI data normalization and processing

- **Templates** (`src/templates/`): Handlebars templates for generated code
  - `type.ts`: TypeScript type definitions template
  - `request.ts`: HTTP request functions template
  - `interface.ts`: API interface definitions template

### Configuration System

The tool uses a configuration-first approach:

- Configuration files: `api-power.config.ts` or `api-power.config.js`
- Main `ApiConfig` interface in `src/types/index.ts` defines all configuration options
- `defineConfig()` function provides type-safe configuration with defaults
- Configuration loading in `src/config/loader.ts`

### Data Flow

1. **Configuration Loading**: Load and validate config from file
2. **Data Fetching**: Use appropriate client (Apifox/Swagger) to fetch API definitions
3. **Data Processing**: Normalize OpenAPI data through processors
4. **Code Generation**: Apply templates to generate TypeScript/JavaScript code
5. **File Writing**: Write generated files to output directory

### Key Types and Enums

- `ServerType`: Platform type ('apifox' | 'swagger')
- `RequestMethod`: HTTP methods (GET, POST, etc.)
- `RequestBodyType`: Request body types (json, form, etc.)
- `ApiConfig`: Main configuration interface
- `InterfaceInfo`: API endpoint metadata structure

## Generated Output Structure

The tool generates a complete service layer:

```
src/service/
├── types.ts           # TypeScript type definitions
├── request.ts         # HTTP request functions
├── index.ts           # Main exports
└── [category]/        # Per-category service files
    ├── index.ts
    └── types/
        └── *.ts       # Individual type files
```

## Development Notes

- The project uses ES modules (`"type": "module"`)
- TypeScript with strict configuration
- ESLint with Ali config for code standards
- Prettier for code formatting
- Husky + lint-staged for pre-commit hooks
- Uses `tsx` for TypeScript execution in development
- `tsdown` for production builds

## Code Generation Constraints

From the project's Cursor rules, the following constraints apply to generated code:

- **DO NOT** use `delete` keyword
- **DO NOT** use `eval` syntax
- Minimize use of closures unless leveraging their specific benefits
- All agents must use MCP (Model Context Protocol)

## Testing and Validation

- **No unit tests**: The project does not have unit tests - do not write or run them
- **Validation method**: Verify changes by running `npx ts-node src/index.ts` and checking generated files in `src/service/`
- **Debug command**: Use `npx api-power debug` to troubleshoot:
  - Configuration loading
  - API authentication
  - Data fetching from source
  - Template processing

## Important Guidelines

- **Generated files**: The `src/service/` folder contains generated files - do not modify without permission
- **Direct execution**: No need to ask permission before running commands or modifying files
- **MCP requirement**: All agents must use MCP (Model Context Protocol)

## Template Customization

Templates use Handlebars syntax and can be customized by modifying files in `src/templates/`. The main templates are:

- `type.ts`: For TypeScript type generation
- `request.ts`: For HTTP request function generation
- `config.ts`: For configuration file templates
