import consola from 'consola';
import { join } from 'path';
import { ProcessedApiData } from '../processors/openapi';
import { ApiConfig } from '../types';
import { ensureDir, fileExists, writeFormattedFile } from '../utils/file';
import { formatCode } from '../utils/formatter';
import { chineseToPinyinCamelCase } from '../utils/path';
import {
  extractRequestProperties,
  extractResponseProperties,
  extractTypeProperties,
  hasRequestBody,
} from './extractor';
import { getRelativeImportPath } from './pathUtils';
import { compileTemplate, interfaceTemplate, requestTemplate, typeTemplate } from './template';

export async function generateRequestFile(config: ApiConfig): Promise<void> {
  const requestFilePath = config.requestFunctionFilePath;

  // Check if file already exists
  if (await fileExists(requestFilePath)) {
    if (process.env.DEBUG) {
      consola.debug(`Request file already exists, skipping: ${requestFilePath}`);
    }
    return;
  }

  try {
    // Format the template code
    const formattedCode = await formatCode(requestTemplate, requestFilePath);

    // Write the file
    await writeFormattedFile(requestFilePath, formattedCode);

    consola.info(`Created request function file: ${requestFilePath}`);
  } catch (error: any) {
    consola.error('Failed to generate request file:', error.message);
    throw error;
  }
}

export async function generateInterfaceFiles(
  processedData: ProcessedApiData,
  config: ApiConfig,
): Promise<void> {
  if (process.env.DEBUG) {
    consola.debug(`Generating ${processedData.interfaces.length} interface files...`);
  }

  // Create output directory
  const { outputDir } = config;

  // Group interfaces by tag
  const interfacesByTag: Record<string, any[]> = {};

  for (const apiInterface of processedData.interfaces) {
    const tags = apiInterface.operation.tags || [];
    if (tags.length > 0) {
      const tag = tags[0]; // Use the first tag
      if (!interfacesByTag[tag]) {
        interfacesByTag[tag] = [];
      }
      interfacesByTag[tag].push(apiInterface);
    } else {
      // For interfaces without tags, group them under a default category
      if (!interfacesByTag.default) {
        interfacesByTag.default = [];
      }
      interfacesByTag.default.push(apiInterface);
    }
  }

  // Generate one index.ts file per tag directory containing all interfaces for that tag
  for (const [tag, interfaces] of Object.entries(interfacesByTag)) {
    const tagDir = chineseToPinyinCamelCase(tag);
    const dirPath = join(outputDir, tagDir);

    // Create directory if it doesn't exist
    await ensureDir(dirPath);

    // Generate all interfaces in this directory in a single index.ts file
    await generateInterfaceFileForTag(tag, interfaces, processedData, config, dirPath);
  }

  // Generate root index.ts file
  await generateRootIndexFile(processedData, config);
}

export async function generateInterfaceFileForTag(
  tag: string,
  interfaces: any[],
  processedData: ProcessedApiData,
  config: ApiConfig,
  dirPath: string,
): Promise<void> {
  // Generate code for all interfaces in this tag
  let combinedCode = '';

  // Collect all used types
  const usedTypes = new Set<string>();

  // Process each interface to collect used types
  for (const apiInterface of interfaces) {
    // Collect types from request parameters
    const requestProps = extractRequestProperties(apiInterface.operation, processedData);
    for (const prop of requestProps) {
      // Check if the type is a reference to another type
      if (processedData.types.some((t: any) => t.name === prop.type)) {
        usedTypes.add(prop.type);
      }
    }

    // Collect types from response properties
    const responseProps = extractResponseProperties(
      apiInterface.operation.responses,
      processedData,
    );
    for (const prop of responseProps) {
      // Check if the type is a reference to another type
      if (processedData.types.some((t: any) => t.name === prop.type)) {
        usedTypes.add(prop.type);
      }
      // Check if the type is an array of references
      if (prop.type.endsWith('[]')) {
        const baseType = prop.type.slice(0, -2);
        if (processedData.types.some((t: any) => t.name === baseType)) {
          usedTypes.add(baseType);
        }
      }
    }
  }

  // Add import statement at the top
  const relativePath = getRelativeImportPath(dirPath, config.requestFunctionFilePath);
  // Remove .ts extension if present
  const cleanRelativePath = relativePath.replace(/\.ts$/, '');
  // combinedCode += `import type { AxiosRequestConfig } from 'axios';\n`;
  combinedCode += `import { RequestConfig, request } from '${cleanRelativePath}';\n`;

  // Add imports for used types
  if (usedTypes.size > 0) {
    // Calculate path to types directory (without index.ts)
    const typesDirPath = join(config.outputDir, 'types');
    const typesRelativePath = getRelativeImportPath(dirPath, typesDirPath);
    const cleanTypesRelativePath = typesRelativePath.replace(/\/$/, ''); // Remove trailing slash if present
    combinedCode += `import type { ${Array.from(usedTypes).join(', ')} } from '${cleanTypesRelativePath}';\n`;
  }

  combinedCode += '\n';

  // Process each interface
  for (const apiInterface of interfaces) {
    // Generate interface name from path and method
    const interfaceName = generateInterfaceName(apiInterface.path, apiInterface.method);

    // Prepare template data
    const templateData = {
      interfaceName,
      functionName: generateFunctionName(apiInterface.path, apiInterface.method),
      path: apiInterface.path,
      method: apiInterface.method.toUpperCase(),
      description: apiInterface.operation.summary || apiInterface.operation.description || '',
      hasParameters: !!(apiInterface.operation.parameters || apiInterface.operation.requestBody),
      parameters: extractRequestProperties(apiInterface.operation, processedData),
      hasResponse: !!apiInterface.operation.responses,
      responseProperties: extractResponseProperties(
        apiInterface.operation.responses,
        processedData,
      ),
      hasBody: hasRequestBody(apiInterface.operation),
    };

    // Remove debug information
    if (process.env.DEBUG && interfaceName === 'ApiRolesGET') {
      consola.debug(`Template data for ${interfaceName}:`, JSON.stringify(templateData, null, 2));
    }

    // Generate code from template
    const template = compileTemplate(interfaceTemplate);
    const code = template(templateData);

    // Remove import statements from individual templates since we added it at the top
    const codeWithoutImport = code.replace(
      /import type \{ AxiosRequestConfig \} from 'axios';\nimport \{ RequestConfig, request \} from '[^']*';\n\n?/,
      '',
    );
    combinedCode += `${codeWithoutImport}\n\n`;
  }

  // Format the combined code
  const formattedCode = await formatCode(combinedCode, join(dirPath, 'index.ts'));

  // Write the file
  const filePath = join(dirPath, 'index.ts');
  await writeFormattedFile(filePath, formattedCode);

  if (process.env.DEBUG) {
    consola.debug(`Created combined interface file: ${filePath}`);
  }
}

export async function generateTypeFiles(
  processedData: ProcessedApiData,
  config: ApiConfig,
): Promise<void> {
  if (process.env.DEBUG) {
    consola.debug(`Generating ${processedData.types.length} type files...`);
  }

  // Create types directory (for backward compatibility)
  const typesDir = join(config.outputDir, 'types');
  await ensureDir(typesDir);

  // Generate each type file
  for (const type of processedData.types) {
    await generateTypeFile(type, processedData, config, typesDir);
  }

  // Generate index.ts file for types directory
  await generateTypesIndexFile(processedData, config);
}

async function generateTypeFile(
  type: any,
  processedData: ProcessedApiData,
  config: ApiConfig,
  typesDir: string,
): Promise<void> {
  // Compile template
  const template = compileTemplate(typeTemplate);

  // Prepare template data
  const templateData = {
    typeName: type.name,
    description: type.schema.description || type.name,
    properties: extractTypeProperties(type.schema),
  };

  // Generate code from template
  const code = template(templateData);

  // Format the code
  const formattedCode = await formatCode(code, join(typesDir, `${type.name}.ts`));

  // Write the file
  const filePath = join(typesDir, `${type.name}.ts`);
  await writeFormattedFile(filePath, formattedCode);

  if (process.env.DEBUG) {
    consola.debug(`Created type file: ${filePath}`);
  }
}

async function generateTypesIndexFile(
  processedData: ProcessedApiData,
  config: ApiConfig,
): Promise<void> {
  const typesDir = join(config.outputDir, 'types');

  // Generate exports for all types
  let indexContent = '';

  for (const type of processedData.types) {
    indexContent += `export type { ${type.name} } from './${type.name}';\n`;
  }

  // Write index.ts file
  const indexPath = join(typesDir, 'index.ts');
  await writeFormattedFile(indexPath, indexContent);

  if (process.env.DEBUG) {
    consola.debug(`Created types index file: ${indexPath}`);
  }
}

export async function generateRootIndexFile(
  processedData: ProcessedApiData,
  config: ApiConfig,
): Promise<void> {
  const { outputDir } = config;

  // Generate exports for all tag directories
  let rootIndexContent = '';

  // Add request function export
  const relativePath = getRelativeImportPath(outputDir, config.requestFunctionFilePath);
  // Remove .ts extension if present
  const cleanRelativePath = relativePath.replace(/\.ts$/, '');
  rootIndexContent += `export * from '${cleanRelativePath}';\n\n`;

  // Add exports for each tag directory
  const tagDirs: string[] = [];

  // Collect all tag directories
  for (const category of processedData.categories) {
    const tagDir = chineseToPinyinCamelCase(category.name);
    tagDirs.push(tagDir);
  }

  // Add default category if it exists
  // tagDirs.push('default');

  for (const tagDir of tagDirs) {
    rootIndexContent += `export * as ${tagDir} from './${tagDir}';\n`;
  }

  // Write root index.ts file
  const rootIndexPath = join(outputDir, 'index.ts');
  await writeFormattedFile(rootIndexPath, rootIndexContent);

  if (process.env.DEBUG) {
    consola.debug(`Created root index file: ${rootIndexPath}`);
  }
}

function generateInterfaceName(path: string, method: string): string {
  // Convert path to camelCase name
  const pathName = path
    .replace(/\{([^}]+)\}/g, 'By$1') // Replace path parameters
    .replace(/[^a-zA-Z0-9]/g, '-') // Replace non-alphanumeric characters
    .replace(/^-+|-+$/g, '') // Trim leading/trailing dashes
    .replace(/-([a-z])/g, (g) => g[1].toUpperCase()); // Convert to camelCase

  // Capitalize first letter and add method
  return pathName.charAt(0).toUpperCase() + pathName.slice(1) + method.toUpperCase();
}

function generateFunctionName(path: string, method: string): string {
  // Convert path to camelCase name
  const pathName = path
    .replace(/\{([^}]+)\}/g, 'By$1') // Replace path parameters
    .replace(/[^a-zA-Z0-9]/g, '-') // Replace non-alphanumeric characters
    .replace(/^-+|-+$/g, '') // Trim leading/trailing dashes
    .replace(/-([a-z])/g, (g) => g[1].toUpperCase()); // Convert to camelCase

  // Convert to camelCase and add method
  return pathName + method.toUpperCase();
}
