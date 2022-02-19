/**
 * The following code is borrowed, with small modifications
 * from the `rushstack` project (https://github.com/microsoft/rushstack)
 * which is licensed under the MIT license (see https://github.com/microsoft/rushstack/blob/master/apps/rush-lib/LICENSE)
 */

/* eslint-disable */

const EventEmitter = require('events');

const childProcess: any = jest.genMockFromModule('child_process');
const childProcessActual = jest.requireActual('child_process');

/**
 * Helper to initialize how the `spawn` mock should behave.
 */
function normalizeSpawnMockConfig(config?: any) {
  return {
    emitError: config?.emitError ?? false,
    returnCode: config?.returnCode ?? 0,
  };
}

/**
 * Initialize the `spawn` mock behavior.
 */
function setSpawnMockConfig(config: any) {
  spawnMockConfig = normalizeSpawnMockConfig(config);
}

/**
 * Mock of `spawn`.
 */
function spawn(command: string, args?: ReadonlyArray<string>, options?: {}) {
  const mock = new childProcess.ChildProcess();

  // Add working event emitters ourselves since `genMockFromModule` does not
  // add them because they are dynamically added by `spawn`.
  const emitter = new EventEmitter();
  const cp = Object.assign({}, mock, {
    stdin: new EventEmitter(),
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
    on: emitter.on,
    emit: emitter.emit,
  });

  setTimeout(() => {
    cp.stdout.emit('data', `${command} ${args}: Mock task is spawned`);

    if (spawnMockConfig.emitError) {
      cp.stderr.emit(
        'data',
        `${command} ${args}: A mock error occurred in the task`,
      );
    }

    cp.emit('exit', spawnMockConfig.returnCode);
  }, 0);

  return cp;
}

childProcess.spawn.mockImplementation(spawn);
childProcess.__setSpawnMockConfig = setSpawnMockConfig;

let spawnMockConfig = normalizeSpawnMockConfig();

/**
 * Ensure the real spawnSync function is used, otherwise LockFile breaks.
 */
childProcess.spawnSync = childProcessActual.spawnSync;

module.exports = childProcess;
