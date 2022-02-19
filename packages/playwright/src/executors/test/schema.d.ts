export interface TestExecutorSchema {
  playwrightConfig: string;
  outputDir: string;
  devServerTarget?: string;
  headed?: boolean;
  record?: boolean;
  parallel?: boolean;
  browser?: string;
  debug?: boolean;
  env?: Record<string, string>;
  spec?: string;
  ignoreTestFiles?: string;
  reporter?: string;
  reporterOptions?: string;
  skipServe?: boolean;
  tag?: string;
}
