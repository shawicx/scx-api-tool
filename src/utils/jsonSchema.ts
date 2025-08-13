import { JSONSchema4, JSONSchema4TypeName } from 'json-schema';
import { compile, Options } from 'json-schema-to-typescript';
import castArray from 'lodash/castArray';
import cloneDeep from 'lodash/cloneDeep';
import forOwn from 'lodash/forOwn';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import isObject from 'lodash/isObject';
import mapKeys from 'lodash/mapKeys';
import path from 'path';
import toJsonSchema from 'to-json-schema';
import { PropDefinitions } from './apiTypes';
import { FileData } from './file';
import { traverse } from './object';
import { toUnixPath } from './path';
import { Defined, OneOrMore } from './types';

/**
 * @description 原地遍历 JSONSchema。
 */
export function traverseJsonSchema(
  jsonSchema: JSONSchema4,
  cb: (jsonSchema: JSONSchema4, currentPath: Array<string | number>) => JSONSchema4,
  currentPath: Array<string | number> = [],
): JSONSchema4 {
  /* istanbul ignore if */
  if (!isObject(jsonSchema)) return jsonSchema;

  // Mock.toJSONSchema 产生的 properties 为数组，然而 JSONSchema4 的 properties 为对象
  if (isArray(jsonSchema.properties)) {
    const processedProperties = (jsonSchema.properties as unknown as JSONSchema4[]).reduce<
      Defined<JSONSchema4['properties']>
    >((props, js) => {
      props[js.name] = js;
      return props;
    }, {});
    // eslint-disable-next-line no-param-reassign
    (jsonSchema as any).properties = processedProperties;
  }

  // 处理传入的 JSONSchema
  cb(jsonSchema, currentPath);

  // 继续处理对象的子元素
  if (jsonSchema.properties) {
    forOwn(jsonSchema.properties, (item: any, key: string) => {
      traverseJsonSchema(item, cb, [...currentPath, key]);
      return undefined;
    });
  }

  // 继续处理数组的子元素
  if (jsonSchema.items) {
    castArray(jsonSchema.items).forEach((item: any, index: number) =>
      traverseJsonSchema(item, cb, [...currentPath, index]),
    );
  }

  // 处理 oneOf
  if (jsonSchema.oneOf) {
    jsonSchema.oneOf.forEach((item: any) => traverseJsonSchema(item, cb, currentPath));
  }

  // 处理 anyOf
  if (jsonSchema.anyOf) {
    jsonSchema.anyOf.forEach((item: any) => traverseJsonSchema(item, cb, currentPath));
  }

  // 处理 allOf
  if (jsonSchema.allOf) {
    jsonSchema.allOf.forEach((item: any) => traverseJsonSchema(item, cb, currentPath));
  }

  return jsonSchema;
}

/**
 * @description 原地处理 JSONSchema。
 * @param jsonSchema 待处理的 JSONSchema
 * @returns 处理后的 JSONSchema
 */
export function processJsonSchema(
  jsonSchemaParam: JSONSchema4,
  customTypeMapping: Record<string, JSONSchema4TypeName>,
): JSONSchema4 {
  return traverseJsonSchema(jsonSchemaParam, (jsonSchema) => {
    // 删除通过 swagger 导入时未剔除的 ref

    Reflect.deleteProperty(jsonSchema, '$ref');

    Reflect.deleteProperty(jsonSchema, '$$ref');

    // 数组只取第一个判断类型
    if (jsonSchema.type === 'array' && Array.isArray(jsonSchema.items) && jsonSchema.items.length) {
      // eslint-disable-next-line no-param-reassign
      (jsonSchema as any).items = jsonSchema.items[0];
    }

    // 处理类型名称为标准的 JSONSchema 类型名称
    if (jsonSchema.type) {
      // 类型映射表，键都为小写
      const typeMapping: Record<string, JSONSchema4TypeName> = {
        byte: 'integer',
        short: 'integer',
        int: 'integer',
        long: 'integer',
        float: 'number',
        double: 'number',
        bigdecimal: 'number',
        char: 'string',
        void: 'null',
        ...mapKeys(customTypeMapping, (_: any, key: string) => key.toLowerCase()),
      };
      const isMultiple = Array.isArray(jsonSchema.type);
      const types = castArray(jsonSchema.type).map((type: any) => {
        // 所有类型转成小写，如：String -> string
        const lowerType = type.toLowerCase() as any;
        // 映射为标准的 JSONSchema 类型
        const mappedType = typeMapping[lowerType] || lowerType;
        return mappedType;
      });
      // eslint-disable-next-line no-param-reassign
      (jsonSchema as any).type = isMultiple ? types : types[0];
    }

    // 移除字段名称首尾空格
    if (jsonSchema.properties) {
      const newProperties: Record<string, any> = {};
      forOwn(jsonSchema.properties, (propDef: any, prop: any) => {
        newProperties[(prop as string).trim()] = propDef;
      });
      // eslint-disable-next-line no-param-reassign
      jsonSchema.properties = newProperties;
      if (Array.isArray(jsonSchema.required)) {
        // eslint-disable-next-line no-param-reassign
        jsonSchema.required = jsonSchema.required.map((prop) => prop.trim());
      }
    }

    return jsonSchema;
  });
}

/**
 * @description 获取适用于 JSTT 的 JSONSchema。
 * @param jsonSchema 待处理的 JSONSchema
 * @returns 适用于 JSTT 的 JSONSchema
 */
export function jsonSchemaToJSTTJsonSchema(
  jsonSchemaParam: JSONSchema4,
  typeName: string,
): JSONSchema4 {
  const jsonSchema = cloneDeep(jsonSchemaParam);
  if (jsonSchema) {
    // 去除最外层的 description 以防止 JSTT 提取它作为类型的注释
    Reflect.deleteProperty(jsonSchema, 'description');
  }
  return traverseJsonSchema(jsonSchema, (schema, currentPath) => {
    // 支持类型引用
    const refValue =
      // YApi 低版本不支持配置 title，可以在 description 里配置
      schema.title == null ? schema.description : schema.title;
    if (refValue?.startsWith('&')) {
      const typeRelativePath = refValue.substring(1);
      const typeAbsolutePath = toUnixPath(
        path
          .resolve(
            path.dirname(`/${currentPath.join('/')}`.replace(/\/{2,}/g, '/')),
            typeRelativePath,
          )
          .replace(/^[a-z]+:/i, ''),
      );
      const typeAbsolutePathArr = typeAbsolutePath.split('/').filter(Boolean);

      let tsTypeLeft = '';
      let tsTypeRight = typeName;
      for (const key of typeAbsolutePathArr) {
        tsTypeLeft += 'NonNullable<';
        tsTypeRight += `[${JSON.stringify(key)}]>`;
      }
      const tsType = `${tsTypeLeft}${tsTypeRight}`;

      schema.tsType = tsType;
    }

    // 去除 title 和 id，防止 json-schema-to-typescript 提取它们作为接口名
    Reflect.deleteProperty(schema, 'title');
    Reflect.deleteProperty(schema, 'id');

    // 忽略数组长度限制
    Reflect.deleteProperty(schema, 'minItems');
    Reflect.deleteProperty(schema, 'maxItems');

    if (schema.type === 'object') {
      // 将 additionalProperties 设为 false
      schema.additionalProperties = false;
    }

    // 删除 default，防止 json-schema-to-typescript 根据它推测类型
    Reflect.deleteProperty(schema, 'default');

    return schema;
  });
}

/**
 * @description 将 JSONSchema 字符串转为 JSONSchema 对象。
 * @param str 要转换的 JSONSchema 字符串
 * @returns 转换后的 JSONSchema 对象
 */
export function jsonSchemaStringToJsonSchema(
  str: string,
  customTypeMapping: Record<string, JSONSchema4TypeName>,
): JSONSchema4 {
  let jsonSchema: JSONSchema4;
  try {
    jsonSchema = JSON.parse(str);
  } catch {
    jsonSchema = {};
  }
  return processJsonSchema(jsonSchema, customTypeMapping);
}

/**
 * @description 获得 JSON 数据的 JSONSchema 对象。
 * @param json JSON 数据
 * @returns JSONSchema 对象
 */
export function jsonToJsonSchema(
  json: object,
  customTypeMapping: Record<string, JSONSchema4TypeName>,
): JSONSchema4 {
  let jsonSchema: JSONSchema4;
  try {
    jsonSchema = toJsonSchema(json) as JSONSchema4;
  } catch {
    jsonSchema = {};
  }
  return processJsonSchema(jsonSchema, customTypeMapping);
}

/**
 * @description 获得 mockjs 模板的 JSONSchema 对象。
 * @param template mockjs 模板
 * @returns JSONSchema 对象
 */
export function mockjsTemplateToJsonSchema(
  template: object,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  customTypeMapping: Record<string, JSONSchema4TypeName>,
): JSONSchema4 {
  const jsonSchema = toJsonSchema(template) as JSONSchema4;
  const actions: Array<() => void> = [];
  // https://github.com/nuysoft/Mock/blob/refactoring/src/mock/constant.js#L27
  const keyRe = /(.+)\|(?:\+(\d+)|([+-]?\d+-?[+-]?\d*)?(?:\.(\d+-?\d*))?)/;
  // https://github.com/nuysoft/Mock/wiki/Mock.Random
  const numberPatterns: string[] = ['natural', 'integer', 'float', 'range', 'increment'];
  const boolPatterns: string[] = ['boolean', 'bool'];
  const normalizeValue = (value: any): any => {
    if (typeof value === 'string' && value.startsWith('@')) {
      const pattern = value.slice(1);
      if (numberPatterns.some((p) => pattern.startsWith(p))) {
        return 1;
      }
      if (boolPatterns.some((p) => pattern.startsWith(p))) {
        return true;
      }
    }
    return value;
  };
  traverse(jsonSchema, (value, key, parent) => {
    if (typeof key === 'string') {
      actions.push(() => {
        Reflect.deleteProperty(parent, key);
        // eslint-disable-next-line no-param-reassign
        parent[
          // https://github.com/nuysoft/Mock/blob/refactoring/src/mock/schema/schema.js#L16
          key.replace(keyRe, '$1')
        ] = normalizeValue(value);
      });
    }
  });
  actions.forEach((action) => action());
  return jsonSchema;
}

/**
 * @description 获得属性定义列表的 JSONSchema 对象。
 * @param propDefinitions 属性定义列表
 * @returns JSONSchema 对象
 */
export function propDefinitionsToJsonSchema(
  propDefinitions: PropDefinitions,
  customTypeMapping: Record<string, JSONSchema4TypeName>,
): JSONSchema4 {
  return processJsonSchema(
    {
      type: 'object',
      required: propDefinitions.reduce<string[]>((res, prop) => {
        if (prop.required) {
          res.push(prop.name);
        }
        return res;
      }, []),
      properties: propDefinitions.reduce<Exclude<JSONSchema4['properties'], undefined>>(
        (res, prop) => {
          res[prop.name] = {
            type: prop.type,
            description: prop.comment,
            ...(prop.type === ('file' as any) ? { tsType: FileData.name } : {}),
          };
          return res;
        },
        {},
      ),
    },
    customTypeMapping,
  );
}

/**
 * @description 根据 JSONSchema 对象生产 TypeScript 类型定义。
 * @param jsonSchema JSONSchema 对象
 * @param typeName 类型名称
 * @param indentSize 缩进大小，默认为4
 * @returns TypeScript 类型定义
 */
export async function jsonSchemaToType(
  jsonSchema: JSONSchema4,
  typeName: string,
  indentSize = 4,
): Promise<string> {
  if (isEmpty(jsonSchema)) {
    return `export interface ${typeName} {}`;
  }
  if (jsonSchema.__is_any__) {
    Reflect.deleteProperty(jsonSchema, '__is_any__');
    return `export type ${typeName} = any`;
  }
  // JSTT 会转换 typeName，因此传入一个全大写的假 typeName，生成代码后再替换回真正的 typeName
  const fakeTypeName = 'THISISAFAKETYPENAME';
  const JSTTOptionsWithIndent: Partial<Options> = {
    bannerComment: '',
    style: {
      bracketSpacing: false,
      printWidth: 120,
      semi: true,
      singleQuote: true,
      tabWidth: indentSize,
      trailingComma: 'none',
      useTabs: false,
    },
  };
  const code = await compile(
    jsonSchemaToJSTTJsonSchema(cloneDeep(jsonSchema), typeName),
    fakeTypeName,
    JSTTOptionsWithIndent,
  );
  return code.replace(fakeTypeName, typeName).trim();
}

/**
 * @description 获取 JSONSchema 对象的指定路径。
 * @param jsonSchema JSONSchema 对象
 * @param path 路径
 * @returns 指定路径的 JSONSchema 对象
 */
export function reachJsonSchema(jsonSchema: JSONSchema4, pathParam: OneOrMore<string>) {
  let last = jsonSchema;
  for (const segment of castArray(pathParam)) {
    const _last = last.properties?.[segment];
    if (!_last) {
      return jsonSchema;
    }
    last = _last;
  }
  return last;
}
