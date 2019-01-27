import * as console from 'console';
import { loadMiddleware, registerTypeScript } from './CommandLineHelpers';
import { ExitCodes } from "./ExitCodes";
import { ITestMiddleware } from './Middleware';
import { TestRunnerMessage } from "./TestProcessMessages";
import { TestRun } from './TestRun';
import { ITestRunnerConfig } from './TestRunnerConfig';

let middleware!: ITestMiddleware[];

process.on('message', (message: TestRunnerMessage) => {
    switch (message.type) {
        case 'Initialize':
            return initialize(message.config);
        case 'RunTests':
            return runTests(message.module);
        case 'Stop':
            return process.exit(ExitCodes.Success);
    }
});

function initialize(config: ITestRunnerConfig) {
    registerTypeScript(config.tsProject);
    middleware = loadMiddleware(config.middleware);
    waitingForTests();
}

function runTests(module: string) {
    try {
        new TestRun(middleware, e => process.send!(e)).runTests([module]);
    } catch (error) {
        console.error(error);
        process.exit(ExitCodes.UnexpectedError);
    }

    if (pastMemoryLimit())
        return process.exit(ExitCodes.ExceededMemoryLimit);

    waitingForTests();
}

function waitingForTests() {
    process.send!({ type: 'WaitingForTests' });
}

function pastMemoryLimit() {
    // Stop at 1GB (node's default limit is 1.5GB)
    return process.memoryUsage().rss > Math.pow(2, 30);
}