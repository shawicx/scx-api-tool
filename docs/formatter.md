# Formatter

The formatter module provides code formatting capabilities for the API code generation tool. It uses Prettier to format code with consistent styling based on file type.

## Overview

The formatter is primarily used in the code generation pipeline to ensure that all generated files are properly formatted according to established style conventions. The main function `formatCode` takes source code and a file path, then applies appropriate formatting rules based on the file extension.

## Functions

### `formatCode(code: string, filePath: string): Promise<string>`

Formats the provided code string using Prettier based on the file extension specified in the `filePath` parameter.

**Parameters:**

- `code` (`string`): The source code to format
- `filePath` (`string`): The path to the file, used to determine the appropriate parser

**Returns:**

- `Promise<string>`: A promise that resolves to the formatted code string, or the original code if formatting fails

**Example:**

```typescript
import { formatCode } from '@scxfe/api-tool/dist/utils/formatter';

const sourceCode = "function hello( ) { console.log('Hello World');}";
const formatted = await formatCode(sourceCode, 'example.ts');
console.log(formatted);
// Output:
// function hello() {
//   console.log('Hello World');
// }
```

## File Type Support

The formatter automatically detects the appropriate parser based on the file extension:

- **`.ts` / `.tsx`**: Uses the TypeScript parser
- **`.js` / `.jsx`**: Uses the Babel parser
- **`.json`**: Uses the JSON parser
- **Other extensions**: Defaults to the TypeScript parser

## Formatting Options

The formatter applies the following Prettier options:

- `singleQuote: true` - Uses single quotes instead of double quotes
- `trailingComma: 'es5'` - Adds trailing commas where valid in ES5
- `tabWidth: 2` - Uses 2 spaces for indentation
- `semi: true` - Adds semicolons at the end of statements

## Error Handling

If Prettier fails to format the code, the formatter logs a warning and returns the original unformatted code. This ensures that the code generation process continues even if formatting fails, while providing visibility into formatting issues.

## Integration

The formatter is used internally by the code generation system in several places:

- `generateRequestFile()`: Formats the request function template before writing to file
- `generateInterfaceFileForTag()`: Formats combined interface code before writing to the tag-specific index.ts file
- `generateTypeFile()`: Formats individual type definition code before writing to file

This ensures all generated code follows consistent formatting standards, making it easier to read and maintain. The formatter is an essential part of the generation process that maintains code quality across all generated files.

## Configuration

The formatter is configured through the project's Prettier settings, though the formatter module uses its own internal configuration that ensures consistency regardless of project-specific Prettier configurations.
