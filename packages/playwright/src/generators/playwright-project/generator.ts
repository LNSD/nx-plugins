import {
  addDependenciesToPackageJson,
  addProjectConfiguration,
  readProjectConfiguration,
  convertNxGenerator,
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  joinPathFragments,
  names,
  offsetFromRoot,
  toJS,
  Tree,
  updateJson,
  ProjectConfiguration,
} from '@nrwl/devkit';
import { Linter, lintProjectGenerator } from '@nrwl/linter';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import { join } from 'path';

import { eslintPluginPlaywrightVersion } from '../../utils/playwright-version';
import { filePathPrefix } from '../../utils/project-name';
import { PlaywrightProjectGeneratorSchema as Schema } from './schema';

export interface PlaywrightProjectSchema extends Schema {
  projectName: string;
  projectRoot: string;
}

function createFiles(tree: Tree, options: PlaywrightProjectSchema) {
  generateFiles(tree, join(__dirname, './files'), options.projectRoot, {
    tmpl: '',
    ...options,
    project: options.project ?? 'Project',
    ext: options.js ? 'js' : 'ts',
    offsetFromRoot: offsetFromRoot(options.projectRoot),
  });

  if (options.js) {
    toJS(tree);
  }
}

function addProject(tree: Tree, options: PlaywrightProjectSchema) {
  const baseE2eProjectConfig: ProjectConfiguration = {
    root: options.projectRoot,
    sourceRoot: joinPathFragments(options.projectRoot, 'src'),
    projectType: 'application',
    targets: {
      e2e: {
        executor: '@lnsd/nx-playwright:test',
        options: {
          playwrightConfig: joinPathFragments(
            options.projectRoot,
            'playwright.config.ts',
          ),
          outputDir: joinPathFragments(
            offsetFromRoot(options.projectRoot),
            'dist',
            'playwright',
            options.projectRoot,
            'test-results',
          ),
        },
        configurations: {
          headed: {
            headed: true,
          },
          debug: {
            debug: true,
          },
        },
      },
    },
    tags: [],
    implicitDependencies: options.project ? [options.project] : undefined,
  };
  let e2eProjectConfig: ProjectConfiguration;

  if (!options.baseUrl && !options.project) {
    throw new Error(`Either "project" or "baseUrl" should be specified.`);
  } else if (options.baseUrl) {
    e2eProjectConfig = {
      ...baseE2eProjectConfig,
      targets: {
        ...baseE2eProjectConfig.targets,
        e2e: {
          ...baseE2eProjectConfig.targets.e2e,
          options: {
            ...baseE2eProjectConfig.targets.e2e.options,
            baseUrl: options.baseUrl,
          },
        },
      },
    };
  } else if (options.project) {
    const project = readProjectConfiguration(tree, options.project);

    let devServerTarget = `${options.project}:serve`;
    if (project.targets.serve?.defaultConfiguration) {
      devServerTarget = `${options.project}:serve:${project.targets.serve.defaultConfiguration}`;
    }

    e2eProjectConfig = {
      ...baseE2eProjectConfig,
      targets: {
        ...baseE2eProjectConfig.targets,
        e2e: {
          ...baseE2eProjectConfig.targets.e2e,
          options: {
            ...baseE2eProjectConfig.targets.e2e.options,
            devServerTarget,
          },
          configurations: {
            ...baseE2eProjectConfig.targets.e2e.configurations,
            production: {
              devServerTarget: `${options.project}:serve:production`,
            },
          },
        },
      },
    };
  }

  addProjectConfiguration(
    tree,
    options.projectName,
    e2eProjectConfig,
    options.standaloneConfig,
  );
}

export async function addLinter(host: Tree, options: PlaywrightProjectSchema) {
  if (options.linter === Linter.None) {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return () => {};
  }

  const installTask = await lintProjectGenerator(host, {
    project: options.projectName,
    linter: options.linter,
    skipFormat: true,
    tsConfigPaths: [joinPathFragments(options.projectRoot, 'tsconfig.json')],
    eslintFilePatterns: [
      `${options.projectRoot}/**/*.${options.js ? 'js' : '{js,ts}'}`,
    ],
    setParserOptionsProject: options.setParserOptionsProject,
    skipPackageJson: options.skipPackageJson,
  });

  if (!options.linter || options.linter !== Linter.EsLint) {
    return installTask;
  }

  let eslintInstallTask;
  if (options.skipPackageJson) {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    eslintInstallTask = () => {};
  } else {
    eslintInstallTask = addDependenciesToPackageJson(
      host,
      {},
      {
        'eslint-plugin-playwright': eslintPluginPlaywrightVersion,
      },
    );
  }

  updateJson(host, join(options.projectRoot, '.eslintrc.json'), (json) => {
    json.extends = ['plugin:playwright/playwright-test', ...json.extends];
    json.overrides = [
      /**
       * In order to ensure maximum efficiency when typescript-eslint generates TypeScript Programs
       * behind the scenes during lint runs, we need to make sure the project is configured to use its
       * own specific tsconfigs, and not fall back to the ones in the root of the workspace.
       */
      {
        files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
        /**
         * NOTE: We no longer set parserOptions.project by default when creating new projects.
         *
         * We have observed that users rarely add rules requiring type-checking to their Nx workspaces, and therefore
         * do not actually need the capabilities which parserOptions.project provides. When specifying parserOptions.project,
         * typescript-eslint needs to create full TypeScript Programs for you. When omitting it, it can perform a simple
         * parse (and AST transformation) of the source files it encounters during a lint run, which is much faster and much
         * less memory intensive.
         *
         * In the rare case that users attempt to add rules requiring type-checking to their setup later on (and haven't set
         * parserOptions.project), the executor will attempt to look for the particular error typescript-eslint gives you
         * and provide feedback to the user.
         */
        parserOptions: options.setParserOptionsProject
          ? { project: `${options.projectRoot}/tsconfig.*?.json` }
          : undefined,
        /**
         * Having an empty rules object present makes it more obvious to the user where they would
         * extend things from if they needed to
         */
        rules: {},
      },
    ];

    return json;
  });

  return runTasksInSerial(installTask, eslintInstallTask);
}

export async function playwrightProjectGenerator(host: Tree, schema: Schema) {
  const options = normalizeOptions(host, schema);
  createFiles(host, options);
  addProject(host, options);
  const linterInstallTask = await addLinter(host, options);
  if (!options.skipFormat) {
    await formatFiles(host);
  }
  return linterInstallTask;
}

function normalizeOptions(
  host: Tree,
  options: Schema,
): PlaywrightProjectSchema {
  const { appsDir } = getWorkspaceLayout(host);
  const projectName = filePathPrefix(
    options.directory ? `${options.directory}-${options.name}` : options.name,
  );

  let projectRoot: string;
  if (options.directory) {
    projectRoot = joinPathFragments(
      appsDir,
      names(options.directory).fileName,
      options.name,
    );
  } else {
    projectRoot = joinPathFragments(appsDir, options.name);
  }

  options.linter = options.linter ?? Linter.EsLint;
  return {
    ...options,
    projectName,
    projectRoot,
  };
}

export default playwrightProjectGenerator;
export const playwrightProjectSchematic = convertNxGenerator(
  playwrightProjectGenerator,
);
