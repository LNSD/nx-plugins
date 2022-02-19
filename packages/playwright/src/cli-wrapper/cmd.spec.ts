import faker from '@faker-js/faker';

import { runCommand } from './cmd';

// Mock child_process, so we can verify tasks are (or are not) invoked as we expect
jest.mock('child_process');

/**
 * See `__mocks__/child_process.js`.
 */
interface SpawnMockConfig {
  emitError: boolean;
  returnCode: number;
}

interface ChildProcessModuleMock {
  /**
   * Initialize the `spawn` mock behavior.
   */
  __setSpawnMockConfig(config?: Partial<SpawnMockConfig>): void;

  spawn: jest.Mock;
}

/**
 * Configure the `child_process` `spawn` mock for these tests.
 * This relies on the mock implementation in `__mocks__/child_process.js`.
 */
function setSpawnMock(options?: Partial<SpawnMockConfig>): jest.Mock {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const cpMocked: ChildProcessModuleMock = require('child_process');
  cpMocked.__setSpawnMockConfig(options);

  const spawnMock: jest.Mock = cpMocked.spawn;
  spawnMock.mockName('spawn');
  return spawnMock;
}

describe('cli-wrapper/cmd', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('should run the command with a success result', async () => {
    /* Given */
    const spawnMock: jest.Mock = setSpawnMock({ returnCode: 0 });
    const command = faker.hacker.noun();
    const args = faker.lorem.words(4).split(' ');
    const onstdout = jest.fn();
    const onstderr = jest.fn();

    /* When */
    const cmdPromise = runCommand(command, args, { onstdout, onstderr });
    jest.runAllTimers();
    const result = await cmdPromise;

    /* Then */
    expect(spawnMock).toHaveBeenCalledTimes(1);
    expect(result).toStrictEqual({ success: true });
    expect(onstdout).toHaveBeenCalledTimes(1);
    expect(onstderr).toHaveBeenCalledTimes(0);
  });

  it('should run the command with a failure result', async () => {
    /* Given */
    const spawnMock: jest.Mock = setSpawnMock({
      returnCode: 1,
      emitError: true,
    });
    const command = faker.hacker.noun();
    const args = faker.lorem.words(4).split(' ');
    const onstdout = jest.fn();
    const onstderr = jest.fn();

    /* When */
    const cmdPromise = runCommand(command, args, { onstdout, onstderr });
    jest.runAllTimers();
    const result = await cmdPromise;

    /* Then */
    expect(spawnMock).toHaveBeenCalledTimes(1);
    expect(result).toStrictEqual({ success: false });
    expect(onstdout).toHaveBeenCalledTimes(1);
    expect(onstderr).toHaveBeenCalledTimes(1);
  });
});
