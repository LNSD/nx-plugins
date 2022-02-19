export interface TestExecutorSchema {
  playwrightConfig: string;
  outputDir: string;
  watch?: boolean;
  devServerTarget?: string;
  headed?: boolean;
  record?: boolean;
  parallel?: boolean;
  baseUrl?: string;
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
