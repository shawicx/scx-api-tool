/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-10 10:42:43
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-24 02:25:21
 * @Description: Generator类，负责协调各个工具类完成代码生成任务
 */
import { castArray } from 'lodash-es';
import {
  CodeGenerator,
  ConfigProcessor,
  DEFAULT_CONFIG,
  FileManager,
  InterfaceCodeGenerator,
  ProjectFetcher,
  type Config,
  type OutputFileList,
  type ServerConfig,
} from './utils';

export class Generator {
  /** 配置 */
  private config: ServerConfig[] = [];

  private disposes: Array<() => any> = [];

  private projectFetcher: ProjectFetcher;
  private interfaceCodeGenerator: InterfaceCodeGenerator;
  private fileManager: FileManager;
  private configProcessor: ConfigProcessor;
  private codeGenerator: CodeGenerator;

  constructor(
    config: Config,
    private options: { cwd: string } = { cwd: process.cwd() },
  ) {
    // config 可能是对象或数组，统一为数组
    this.config = castArray(config);

    // 初始化工具类
    this.projectFetcher = new ProjectFetcher();
    this.interfaceCodeGenerator = new InterfaceCodeGenerator();
    this.fileManager = new FileManager(this.options);
    this.configProcessor = new ConfigProcessor();
    this.codeGenerator = new CodeGenerator(
      this.projectFetcher,
      this.interfaceCodeGenerator,
      this.options,
    );
  }

  async prepare(): Promise<void> {
    this.config = await this.configProcessor.prepare(this.config);
  }

  async generate(): Promise<OutputFileList> {
    return this.codeGenerator.generate(this.config);
  }

  /**
   * 生成index.ts文件，将目录中的所有方法和interface类型导出
   * @param directoryPaths 目录路径
   * @param outputDir 输出目录
   */
  async generateIndexFile(directoryPaths: string[], outputDir: string = DEFAULT_CONFIG.OUTPUT_DIR) {
    return this.fileManager.generateIndexFile(directoryPaths, outputDir);
  }

  async write(outputFileList: OutputFileList) {
    return this.fileManager.write(outputFileList);
  }

  async tsc(file: string) {
    return this.fileManager.tsc(file);
  }

  async destroy() {
    return this.configProcessor.destroy();
  }
}
