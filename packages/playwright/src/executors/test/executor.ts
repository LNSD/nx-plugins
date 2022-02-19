import {
  ExecutorContext,
  logger,
  parseTargetString,
  readTargetOptions,
  runExecutor,
} from '@nrwl/devkit';
import { basename, dirname } from 'path';

import { TestExecutorSchema } from './schema';
import { buildTestCommand, TestOptions } from './test-cmd';

function normalizeOptions(options: TestExecutorSchema): TestOptions {
  const testOptions: TestOptions = {
    config: basename(options.playwrightConfig),
    output: options.outputDir,
  };

  testOptions.headed = options.headed;
  testOptions.browser = options.browser;
  testOptions.debug = options.debug;
  testOptions.reporter = options.reporter;
  if (options.parallel === false) {
    testOptions.workers = 1;
  }

  return testOptions;
}

async function* startDevServer(
  options: TestExecutorSchema,
  context: ExecutorContext,
) {
  // no dev server, return the provisioned base url
  if (!options.devServerTarget || options.skipServe) {
    yield options.baseUrl;
    return;
  }

  const targetDescription = parseTargetString(options.devServerTarget);
  const devServerTargetOpts = readTargetOptions(targetDescription, context);
  const targetSupportsWatchOpt =
    Object.keys(devServerTargetOpts).includes('watch');

  for await (const output of await runExecutor<{
    success: boolean;
    baseUrl?: string;
  }>(
    targetDescription,
    // @NOTE: Do not forward watch option if not supported by the target dev server,
    // this is relevant for running Cypress against dev server target that does not support this option,
    // for instance @nguniversal/builders:ssr-dev-server.
    targetSupportsWatchOpt ? { watch: options.watch } : {},
    context,
  )) {
    if (!output.success && !options.watch) {
      throw new Error('Could not compile application files');
    }

    yield options.baseUrl || (output.baseUrl as string);
  }
}

async function runPlaywrightTests(
  baseUrl: string,
  options: TestExecutorSchema,
) {
  const testOptions = normalizeOptions(options);

  const projectFolderPath = dirname(options.playwrightConfig);
  const runCmd = buildTestCommand(testOptions, 'src'); // TODO: Allow files configuration

  const result = await runCmd({
    cwd: projectFolderPath,
    env: options.env,
    onstdout: logger.log,
    onstderr: logger.error,
  });

  return result.success;
}

export default async function runTestExecutor(
  options: TestExecutorSchema,
  context: ExecutorContext,
) {
  let success;
  for await (const baseUrl of startDevServer(options, context)) {
    try {
      success = await runPlaywrightTests(baseUrl, options);
    } catch (e) {
      logger.error(e.message);
      success = false;
    }

    if (!options.watch) {
      break;
    }
  }

  return { success };
}
