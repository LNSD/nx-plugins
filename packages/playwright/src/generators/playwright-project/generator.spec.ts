import {
  readJson,
  addProjectConfiguration,
  readProjectConfiguration,
  updateProjectConfiguration,
  Tree,
  WorkspaceJsonConfiguration,
} from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { Linter } from '@nrwl/linter';

import { playwrightProjectGenerator } from './generator';
import { PlaywrightProjectGeneratorSchema as Schema } from './schema';

describe('generator:playwright-project', () => {
  let tree: Tree;
  const defaultOptions: Omit<Schema, 'name' | 'project'> = {
    linter: Linter.EsLint,
    standaloneConfig: false,
  };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();

    addProjectConfiguration(tree, 'my-app', {
      root: 'my-app',
      targets: {
        serve: {
          executor: 'serve-executor',
          options: {},
          configurations: {
            production: {},
          },
        },
      },
    });

    addProjectConfiguration(tree, 'my-dir-my-app', {
      root: 'my-dir/my-app',
      targets: {
        serve: {
          executor: 'serve-executor',
          options: {},
          configurations: {
            production: {},
          },
        },
      },
    });
  });

  describe('Playwright Project', () => {
    it('should generate files', async () => {
      await playwrightProjectGenerator(tree, {
        ...defaultOptions,
        name: 'my-app-e2e',
        project: 'my-app',
      });

      expect(tree.exists('apps/my-app-e2e/playwright.config.ts')).toBeTruthy();
      expect(tree.exists('apps/my-app-e2e/src/app.spec.ts')).toBeTruthy();
      expect(tree.exists('apps/my-app-e2e/src/support/app.po.ts')).toBeTruthy();
    });

    it('should add update `workspace.json` file', async () => {
      await playwrightProjectGenerator(tree, {
        name: 'my-app-e2e',
        project: 'my-app',
        linter: Linter.TsLint,
        standaloneConfig: false,
      });
      const workspaceJson = readJson(tree, 'workspace.json');
      const project = workspaceJson.projects['my-app-e2e'];

      expect(project.root).toEqual('apps/my-app-e2e');

      expect(project.architect.lint).toEqual({
        builder: '@angular-devkit/build-angular:tslint',
        options: {
          tsConfig: ['apps/my-app-e2e/tsconfig.json'],
          exclude: ['**/node_modules/**', '!apps/my-app-e2e/**/*'],
        },
      });
      expect(project.architect.e2e).toEqual({
        builder: '@lnsd/nx-playwright:test',
        options: {
          playwrightConfig: 'apps/my-app-e2e/playwright.config.ts',
          outputDir: '../../dist/playwright/apps/my-app-e2e/test-results',
          devServerTarget: 'my-app:serve',
        },
        configurations: {
          production: {
            devServerTarget: 'my-app:serve:production',
          },
          debug: {
            debug: true,
          },
          headed: {
            headed: true,
          },
        },
      });
    });

    it('should add update `workspace.json` file (baseUrl)', async () => {
      await playwrightProjectGenerator(tree, {
        name: 'my-app-e2e',
        project: 'my-app',
        baseUrl: 'http://localhost:3000',
        linter: Linter.TsLint,
        standaloneConfig: false,
      });
      const workspaceJson = readJson(tree, 'workspace.json');
      const project = workspaceJson.projects['my-app-e2e'];

      expect(project.root).toEqual('apps/my-app-e2e');

      expect(project.architect.lint).toEqual({
        builder: '@angular-devkit/build-angular:tslint',
        options: {
          tsConfig: ['apps/my-app-e2e/tsconfig.json'],
          exclude: ['**/node_modules/**', '!apps/my-app-e2e/**/*'],
        },
      });
      expect(project.architect.e2e).toEqual({
        builder: '@lnsd/nx-playwright:test',
        options: {
          playwrightConfig: 'apps/my-app-e2e/playwright.config.ts',
          outputDir: '../../dist/playwright/apps/my-app-e2e/test-results',
          baseUrl: 'http://localhost:3000',
        },
        configurations: {
          debug: {
            debug: true,
          },
          headed: {
            headed: true,
          },
        },
      });
    });

    it('should add update `workspace.json` file for a project with a defaultConfiguration', async () => {
      const originalProject = readProjectConfiguration(tree, 'my-app');
      originalProject.targets.serve.defaultConfiguration = 'development';
      originalProject.targets.serve.configurations.development = {};
      updateProjectConfiguration(tree, 'my-app', originalProject);

      await playwrightProjectGenerator(tree, {
        name: 'my-app-e2e',
        project: 'my-app',
        linter: Linter.TsLint,
        standaloneConfig: false,
      });
      const workspaceJson = readJson(tree, 'workspace.json');
      const project = workspaceJson.projects['my-app-e2e'];

      expect(project.root).toEqual('apps/my-app-e2e');

      expect(project.architect.lint).toEqual({
        builder: '@angular-devkit/build-angular:tslint',
        options: {
          tsConfig: ['apps/my-app-e2e/tsconfig.json'],
          exclude: ['**/node_modules/**', '!apps/my-app-e2e/**/*'],
        },
      });
      expect(project.architect.e2e).toEqual({
        builder: '@lnsd/nx-playwright:test',
        options: {
          playwrightConfig: 'apps/my-app-e2e/playwright.config.ts',
          outputDir: '../../dist/playwright/apps/my-app-e2e/test-results',
          devServerTarget: 'my-app:serve:development',
        },
        configurations: {
          production: {
            devServerTarget: 'my-app:serve:production',
          },
          debug: {
            debug: true,
          },
          headed: {
            headed: true,
          },
        },
      });
    });

    it('should add update `workspace.json` file properly when eslint is passed', async () => {
      await playwrightProjectGenerator(tree, {
        name: 'my-app-e2e',
        project: 'my-app',
        linter: Linter.EsLint,
        standaloneConfig: false,
      });
      const workspaceJson = readJson(tree, 'workspace.json');
      const project = workspaceJson.projects['my-app-e2e'];

      expect(project.architect.lint).toEqual({
        builder: '@nrwl/linter:eslint',
        outputs: ['{options.outputFile}'],
        options: {
          lintFilePatterns: ['apps/my-app-e2e/**/*.{js,ts}'],
        },
      });
    });

    it('should not add lint target when "none" is passed', async () => {
      await playwrightProjectGenerator(tree, {
        name: 'my-app-e2e',
        project: 'my-app',
        linter: Linter.None,
        standaloneConfig: false,
      });
      const workspaceJson = readJson(tree, 'workspace.json');
      const project = workspaceJson.projects['my-app-e2e'];

      expect(project.architect.lint).toBeUndefined();
    });

    it('should update tags and implicit dependencies', async () => {
      await playwrightProjectGenerator(tree, {
        name: 'my-app-e2e',
        project: 'my-app',
        linter: Linter.EsLint,
        standaloneConfig: false,
      });

      const project = readProjectConfiguration(tree, 'my-app-e2e');
      expect(project.tags).toEqual([]);
      expect(project.implicitDependencies).toEqual(['my-app']);
    });

    // TODO: Review configuration parsing
    it.skip('should set right path names in `playwright.config.ts`', async () => {
      await playwrightProjectGenerator(tree, {
        ...defaultOptions,
        name: 'my-app-e2e',
        project: 'my-app',
      });
      const playwrightJson = readJson(
        tree,
        'apps/my-app-e2e/playwright.config.ts',
      );

      expect(playwrightJson).toEqual({
        fileServerFolder: '.',
        fixturesFolder: './src/fixtures',
        integrationFolder: './src/integration',
        modifyObstructiveCode: false,
        pluginsFile: './src/plugins/index',
        supportFile: './src/support/index.ts',
        video: true,
        videosFolder: '../../dist/playwright/apps/my-app-e2e/videos',
        screenshotsFolder: '../../dist/playwright/apps/my-app-e2e/screenshots',
        chromeWebSecurity: false,
      });
    });

    it('should set right path names in `tsconfig.e2e.json`', async () => {
      await playwrightProjectGenerator(tree, {
        ...defaultOptions,
        name: 'my-app-e2e',
        project: 'my-app',
      });
      const tsconfigJson = readJson(tree, 'apps/my-app-e2e/tsconfig.json');
      expect(tsconfigJson).toMatchSnapshot();
    });

    describe('nested', () => {
      it('should update workspace.json', async () => {
        await playwrightProjectGenerator(tree, {
          name: 'my-app-e2e',
          project: 'my-dir-my-app',
          directory: 'my-dir',
          linter: Linter.TsLint,
          standaloneConfig: false,
        });
        const projectConfig = readJson(tree, 'workspace.json').projects[
          'my-dir-my-app-e2e'
        ];

        expect(projectConfig).toBeDefined();
        expect(projectConfig.architect.lint).toEqual({
          builder: '@angular-devkit/build-angular:tslint',
          options: {
            tsConfig: ['apps/my-dir/my-app-e2e/tsconfig.json'],
            exclude: ['**/node_modules/**', '!apps/my-dir/my-app-e2e/**/*'],
          },
        });

        expect(projectConfig.architect.e2e).toEqual({
          builder: '@lnsd/nx-playwright:test',
          options: {
            playwrightConfig: 'apps/my-dir/my-app-e2e/playwright.config.ts',
            outputDir:
              '../../../dist/playwright/apps/my-dir/my-app-e2e/test-results',
            devServerTarget: 'my-dir-my-app:serve',
          },
          configurations: {
            production: {
              devServerTarget: 'my-dir-my-app:serve:production',
            },
            debug: {
              debug: true,
            },
            headed: {
              headed: true,
            },
          },
        });
      });

      // TODO: Review configuration parsing
      it.skip('should set right path names in `playwright.config.ts`', async () => {
        await playwrightProjectGenerator(tree, {
          ...defaultOptions,
          name: 'my-app-e2e',
          project: 'my-dir-my-app',
          directory: 'my-dir',
        });
        const playwrightJson = readJson(
          tree,
          'apps/my-dir/my-app-e2e/playwright.config.ts',
        );

        expect(playwrightJson).toEqual({
          fileServerFolder: '.',
          fixturesFolder: './src/fixtures',
          integrationFolder: './src/integration',
          modifyObstructiveCode: false,
          pluginsFile: './src/plugins/index',
          supportFile: './src/support/index.ts',
          video: true,
          videosFolder:
            '../../../dist/playwright/apps/my-dir/my-app-e2e/videos',
          screenshotsFolder:
            '../../../dist/playwright/apps/my-dir/my-app-e2e/screenshots',
          chromeWebSecurity: false,
        });
      });

      it('should set right path names in `tsconfig.e2e.json`', async () => {
        await playwrightProjectGenerator(tree, {
          ...defaultOptions,
          name: 'my-app-e2e',
          project: 'my-dir-my-app',
          directory: 'my-dir',
        });
        const tsconfigJson = readJson(
          tree,
          'apps/my-dir/my-app-e2e/tsconfig.json',
        );

        expect(tsconfigJson).toMatchSnapshot();
      });
    });

    describe('--project', () => {
      describe('none', () => {
        it('should not add any implicit dependencies', async () => {
          await playwrightProjectGenerator(tree, {
            ...defaultOptions,
            name: 'my-app-e2e',
            baseUrl: 'http://localhost:7788',
          });

          const workspaceJson = readJson<WorkspaceJsonConfiguration>(
            tree,
            'workspace.json',
          );
          const projectConfig = workspaceJson.projects['my-app-e2e'];
          expect(projectConfig.implicitDependencies).not.toBeDefined();
          expect(projectConfig.tags).toEqual([]);
        });
      });
    });

    describe('--linter', () => {
      describe('eslint', () => {
        it('should add eslint-plugin-playwright', async () => {
          await playwrightProjectGenerator(tree, {
            name: 'my-app-e2e',
            project: 'my-app',
            linter: Linter.EsLint,
            standaloneConfig: false,
          });
          const packageJson = readJson(tree, 'package.json');
          expect(
            packageJson.devDependencies['eslint-plugin-playwright'],
          ).toBeTruthy();

          const eslintrcJson = readJson(tree, 'apps/my-app-e2e/.eslintrc.json');
          expect(eslintrcJson).toMatchInlineSnapshot(`
            Object {
              "extends": Array [
                "plugin:playwright/playwright-test",
                "../../.eslintrc.json",
              ],
              "ignorePatterns": Array [
                "!**/*",
              ],
              "overrides": Array [
                Object {
                  "files": Array [
                    "*.ts",
                    "*.tsx",
                    "*.js",
                    "*.jsx",
                  ],
                  "rules": Object {},
                },
              ],
            }
          `);
        });
      });
    });
    it('should generate in the correct folder', async () => {
      await playwrightProjectGenerator(tree, {
        ...defaultOptions,
        name: 'other-e2e',
        project: 'my-app',
        directory: 'one/two',
      });
      const workspace = readJson(tree, 'workspace.json');
      expect(workspace.projects['one-two-other-e2e']).toBeDefined();
      [
        'apps/one/two/other-e2e/playwright.config.ts',
        'apps/one/two/other-e2e/src/app.spec.ts',
      ].forEach((path) => expect(tree.exists(path)).toBeTruthy());
    });

    describe('project with directory in its name', () => {
      beforeEach(async () => {
        await playwrightProjectGenerator(tree, {
          name: 'my-dir/my-app-e2e',
          project: 'my-dir-my-app',
          linter: Linter.TsLint,
          standaloneConfig: false,
        });
      });

      it('should update workspace.json', async () => {
        const projectConfig = readJson(tree, 'workspace.json').projects[
          'my-dir-my-app-e2e'
        ];

        expect(projectConfig).toBeDefined();
        expect(projectConfig.architect.lint).toEqual({
          builder: '@angular-devkit/build-angular:tslint',
          options: {
            tsConfig: ['apps/my-dir/my-app-e2e/tsconfig.json'],
            exclude: ['**/node_modules/**', '!apps/my-dir/my-app-e2e/**/*'],
          },
        });

        expect(projectConfig.architect.e2e).toEqual({
          builder: '@lnsd/nx-playwright:test',
          options: {
            playwrightConfig: 'apps/my-dir/my-app-e2e/playwright.config.ts',
            outputDir:
              '../../../dist/playwright/apps/my-dir/my-app-e2e/test-results',
            devServerTarget: 'my-dir-my-app:serve',
          },
          configurations: {
            production: {
              devServerTarget: 'my-dir-my-app:serve:production',
            },
            debug: {
              debug: true,
            },
            headed: {
              headed: true,
            },
          },
        });
      });

      it('should update nx.json', async () => {
        const project = readProjectConfiguration(tree, 'my-dir-my-app-e2e');
        expect(project.tags).toEqual([]);
        expect(project.implicitDependencies).toEqual(['my-dir-my-app']);
      });

      // TODO: Review configuration parsing
      it.skip('should set right path names in `playwright.json`', async () => {
        const playwrightJson = readJson(
          tree,
          'apps/my-dir/my-app-e2e/playwright.json',
        );

        expect(playwrightJson).toEqual({
          fileServerFolder: '.',
          fixturesFolder: './src/fixtures',
          integrationFolder: './src/integration',
          modifyObstructiveCode: false,
          pluginsFile: './src/plugins/index',
          supportFile: './src/support/index.ts',
          video: true,
          videosFolder:
            '../../../dist/playwright/apps/my-dir/my-app-e2e/videos',
          screenshotsFolder:
            '../../../dist/playwright/apps/my-dir/my-app-e2e/screenshots',
          chromeWebSecurity: false,
        });
      });
    });
  });
});
