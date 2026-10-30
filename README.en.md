# @scxfe/api-tool

**English | [简体中文](./README.md)**

[![npm version](https://img.shields.io/npm/v/@scxfe/api-tool.svg)](https://www.npmjs.com/package/@scxfe/api-tool)
[![license](https://img.shields.io/npm/l/@scxfe/api-tool.svg)](./LICENSE)
[![node](https://img.shields.io/node/v/@scxfe/api-tool.svg)](./package.json)

A powerful Node.js CLI tool that automatically generates TypeScript/JavaScript code from API management platforms such as Swagger/OpenAPI 3.0 and Apifox.

## Features

- **Multi-platform**: supports Swagger/OpenAPI and Apifox
- **Type generation**: full TypeScript type definitions, in either TypeScript or Zod mode
- **Code generation**: HTTP request functions and interface code
- **Path parameter interpolation**: turns `{param}` placeholders in OpenAPI paths into template literals (e.g. `` `/api/stock/${params.code}` ``), with multi-parameter support and safe escaping
- **Flexible configuration**: custom naming strategies, output directories, code style, and more
- **Hook system**: run custom logic at different stages of the generation pipeline
- **Watch mode**: regenerate automatically when the config file changes
- **React/Vue hooks generation**: optionally generate React Query v5 style `useQuery` / `useMutation` hooks (`generateHooks: true`), also supporting vue-query, SWR and ahooks

## Quick Start

### Installation

```bash
# Global install (recommended)
pnpm install -g @scxfe/api-tool

# Or install locally in your project
pnpm install --save-dev @scxfe/api-tool

# Or use npx
npx @scxfe/api-tool
```

### Basic Usage

```bash
# 1. Initialize the config file
npx api-power init

# 2. Edit api-power.config.ts / api-power.config.js

# 3. Generate code
npx api-power
```

> The docs are currently written in Chinese; English speakers are welcome to follow the code examples, and contributions translating docs are appreciated.

## Documentation

- [Getting Started](./docs/getting-started/index.md) (Chinese) - introduction and installation
- [CLI Reference](./docs/guides/cli.md) (Chinese) - commands and usage
- [Configuration Guide](./docs/guides/configuration.md) (Chinese) - all configuration options with examples
- [Advanced Usage](./docs/guides/advanced.md) (Chinese) - naming strategies, hook system, watch mode
- [Examples](./docs/guides/examples.md) (Chinese) - complete examples and generated output

## Configuration Examples

`defineConfig` uses a multi-service (microservice) layout: common options (such as `typesFormat`, `baseOutputDir`, `namingStrategy`) are shared by all services, while each service declares its own data source and output location in the `services` array. It returns `ApiConfig[]` — a single source is simply an array of length 1.

### Single Service — Zod mode (runtime validation)

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  // Common config: inherited by all services
  baseOutputDir: 'src/service', // shared root output directory
  typesFormat: 'zod', // Zod schemas for typing + runtime validation
  generateApi: true,
  generateTypes: true,

  services: [
    {
      name: 'main', // unique service name; folder defaults to name
      folder: '.', // output goes directly into baseOutputDir
      source: 'https://api.apifox.com/v1/projects/YOUR_PROJECT_ID/export-openapi',
      token: 'YOUR_ACCESS_TOKEN',
    },
  ],
});
```

### Single Service — TypeScript mode (compile-time type checking)

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  baseOutputDir: 'src/service',
  typesFormat: 'typescript', // TypeScript interfaces for typing
  generateApi: true,
  generateTypes: true,

  services: [
    {
      name: 'main',
      folder: '.',
      source: 'https://api.apifox.com/v1/projects/YOUR_PROJECT_ID/export-openapi',
      token: 'YOUR_ACCESS_TOKEN',
    },
  ],
});
```

### Multiple Services (Microservices)

For projects talking to several backends (user service, order service, etc.). Each service has its own data source, token, and output sub-directory; by default they share one `request.ts` under `baseOutputDir`.

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  baseOutputDir: 'src/service', // request.ts is shared at this level
  typesFormat: 'typescript',
  generateApi: true,
  generateTypes: true,

  services: [
    {
      name: 'user',
      source: 'https://user-svc.example.com/v3/api-docs',
      token: 'APS-user-token',
      // folder omitted → defaults to 'user' → output src/service/user
    },
    {
      name: 'order',
      source: 'https://order-svc.example.com/swagger.json',
      token: 'APS-order-token',
      folder: 'trade/order', // multi-segment folder → output src/service/trade/order
    },
  ],
});
```

#### Per-service isolated request instance (`requestMode: 'isolated'`)

Different backends may need different baseURLs, auth, timeouts, and response unwrapping. By default all services share one `request.ts` (global axios instance); declaring `requestMode: 'isolated'` for a service generates a dedicated `request.ts` inside its own output directory, with a **private instance** created via `axios.create` — baseURL / interceptors / tokens stay independent:

```typescript
export default defineConfig({
  baseOutputDir: 'src/service',

  services: [
    {
      name: 'user',
      source: 'https://user-svc.example.com/v3/api-docs',
      // default shared: shares src/service/request.ts (global axios)
    },
    {
      name: 'order',
      source: 'https://order-svc.example.com/swagger.json',
      requestMode: 'isolated', // dedicated request file → src/service/order/request.ts
      requestBaseURL: '/order-api', // baked into the private instance (optional)
      requestTimeout: 30000, // per-service timeout override (optional)
    },
  ],
});
```

Notes:

- `requestMode` (default `'shared'`): can be set at the top level as the default for all services, or overridden per service
- `requestBaseURL`: only effective in `isolated` mode, baked into the generated `axios.create({ baseURL, timeout })`; configuring it under `shared` mode produces a warning
- Auth and response unwrapping: implement via interceptors in each request file's `customizeAxios` extension point (the file is generated only once; customizations survive regeneration)
- Services sharing the same `request.ts` with inconsistent `requestTimeout` get a `SHARED_REQUEST_CONFLICT` warning (the shared file is generated once, first-come-first-served)

### Full Configuration

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  // Common root output directory
  baseOutputDir: 'src/service',

  // Type generation format
  typesFormat: 'zod', // or 'typescript'

  // Output options
  generateApi: true,
  generateTypes: true,

  // Hooks generation (optional, requires generateApi: true; install the lib yourself)
  generateHooks: true,
  hooksLibrary: 'react-query', // 'react-query'(@tanstack/react-query@^5) | 'vue-query'(@tanstack/vue-query@^5) | 'swr'(swr@^2) | 'ahooks'(ahooks@^3)
  hooksValidateResponse: false, // inject runtime response validation in zod mode (Schema.parse)
  queryKeyPrefix: ['main'], // queryKey prefix; one prefix per service is recommended in multi-service setups

  // Code generation options
  target: 'typescript',
  indentSize: 2,
  comment: true,
  transformPath: (p) => '/api/v1' + p,

  // Request function options
  requestFunctionName: 'request',
  requestParamName: 'params',
  requestMethodStyle: 'config',
  requestMode: 'shared', // 'shared' (default) | 'isolated' per-service file + private axios instance
  // requestBaseURL: '/api', // only effective in isolated mode

  // Custom naming strategy
  namingStrategy: {
    interfaceName: (info) => {
      const method = info.method.charAt(0).toUpperCase() + info.method.slice(1).toLowerCase();
      const pathName = info.path
        .replace(/\{[^}]+\}/g, '')
        .replace(/^\//, '')
        .replace(/\//g, '-')
        .replace(/^-+|-+$/g, '');
      return `${method}${pathName}`;
    },
  },

  // Lifecycle hooks
  hooks: {
    beforeGenerate: () => {
      console.log('Generating code...');
    },
    afterGenerate: () => {
      console.log('Code generation finished');
    },
  },

  // Service declarations
  services: [
    {
      name: 'main',
      folder: '.',
      source: 'https://api.apifox.com/v1/projects/YOUR_PROJECT_ID/export-openapi',
      token: 'YOUR_ACCESS_TOKEN',
    },
  ],
});
```

## Project Structure

Output follows `baseOutputDir/<folder-or-name>/...`. By default `request.ts` lives at the `baseOutputDir` level and is shared by all services; services declared with `requestMode: 'isolated'` get a dedicated `request.ts` (private axios instance) inside their own output directory. Each service's output (category directories, types/schemas, index.ts) lands under `join(baseOutputDir, folder ?? name)`. Without an explicit `requestFunctionFilePath`, the default path follows `baseOutputDir` (i.e. `join(baseOutputDir, 'request.ts')`).

### Single-service output (`folder: '.'`)

#### Zod mode

```
src/service/                      # baseOutputDir
├── request.ts                    # shared request function (at baseOutputDir level, never cleaned)
├── index.ts                      # root re-exports
├── AIFuWu/                       # category directory (tag name, transliterated)
│   ├── index.ts                  # API functions (types imported from schema)
│   └── schema.ts                 # merged schemas (all endpoint schemas + inferred types)
├── YongHuGuanLi/
│   ├── index.ts
│   └── schema.ts
└── schemas/                      # type schemas
    ├── UserSchema.ts
    ├── RoleSchema.ts
    └── index.ts
```

#### TypeScript mode

```
src/service/                      # baseOutputDir
├── request.ts                    # shared request function
├── index.ts                      # root re-exports
├── AIFuWu/                       # category directory
│   └── index.ts                  # API functions
├── YongHuGuanLi/
│   └── index.ts
└── types/                        # type definitions
    ├── index.ts
    ├── User.ts
    └── Role.ts
```

### Multi-service output (microservices)

```
src/service/                      # baseOutputDir
├── request.ts                    # shared request function (generated once, shared by all services)
├── user/                         # join(base, 'user') (folder defaults to name)
│   ├── index.ts
│   ├── <tag-transliteration>/index.ts
│   └── types/
└── trade/order/                  # join(base, 'trade/order') (multi-segment folder)
    ├── index.ts
    ├── <tag-transliteration>/index.ts
    └── types/
```

## Development

```bash
# Install dependencies
pnpm install

# Build the project
pnpm run build

# Generate code (dev mode)
pnpm run dev

# Format and lint-fix
pnpm run lint:fix

# Build docs
pnpm run docs:build

# Preview the docs build
pnpm run docs:preview
```

## License

MIT License - see the [LICENSE](LICENSE) file.

## Contributing

Issues and pull requests are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) (bilingual) to get started, and note that this project follows the [Code of Conduct](./CODE_OF_CONDUCT.md).

- [Contribution Guide](./CONTRIBUTING.md) (中文 + English)
- [Code of Conduct](./CODE_OF_CONDUCT.md) (中文 + English)
- [Security Policy](./SECURITY.md) (中文 + English)
- [Changelog](./CHANGELOG.md)

## Contact

- Author: shawicx
- Email: d35f3153@proton.me
- GitHub: [@shawicx](https://github.com/shawicx)
