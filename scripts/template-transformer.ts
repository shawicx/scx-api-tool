/*
 * TypeScript Transform API 示例
 * 在编译时将模板文件内容注入到代码中
 * 这是一个高级方案的示例，展示如何使用 TypeScript Transform API
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

interface TemplateTransformOptions {
  templateDir: string;
  templateFiles: Record<string, string>;
}

function createTemplateTransformer(
  options: TemplateTransformOptions,
): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext) => {
    return (sourceFile: ts.SourceFile) => {
      if (!sourceFile.fileName.includes('templateUtils.ts')) {
        return sourceFile;
      }

      const visitor = (node: ts.Node): ts.Node => {
        // 查找模板常量声明
        if (
          ts.isVariableDeclaration(node) &&
          node.name &&
          ts.isIdentifier(node.name) &&
          node.name.text === 'TEMPLATES'
        ) {
          // 创建模板对象
          const templateProperties: ts.PropertyAssignment[] = [];

          for (const [name, filePath] of Object.entries(options.templateFiles)) {
            const fullPath = path.resolve(options.templateDir, filePath);
            if (fs.existsSync(fullPath)) {
              const content = fs.readFileSync(fullPath, 'utf8');
              const templateLiteral = ts.factory.createTemplateExpression(
                ts.factory.createTemplateHead(content),
                [],
              );

              templateProperties.push(
                ts.factory.createPropertyAssignment(
                  ts.factory.createIdentifier(name),
                  templateLiteral,
                ),
              );
            }
          }

          const objectLiteral = ts.factory.createObjectLiteralExpression(templateProperties, true);

          return ts.factory.updateVariableDeclaration(
            node,
            node.name,
            node.exclamationToken,
            node.type,
            objectLiteral,
          );
        }

        return ts.visitEachChild(node, visitor, context);
      };

      return ts.visitNode(sourceFile, visitor);
    };
  };
}

// 使用示例：
/*
// tsconfig.json
{
  "compilerOptions": {
    "plugins": [
      {
        "transform": "./scripts/template-transformer.ts",
        "templateDir": "src/templates",
        "templateFiles": {
          "config": "config.ts",
          "request": "request.ts"
        }
      }
    ]
  }
}
*/

export default createTemplateTransformer;
