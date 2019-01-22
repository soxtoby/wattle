import * as console from 'console';
import { args } from './CommandLineArgs';
import { loadMiddleware, registerTypeScript } from './CommandLineHelpers';
import { ExitCodes } from "./ExitCodes";
import { TestProcessMessage } from "./TestProcessMessages";
import { TestRunner } from './TestRunner';

registerTypeScript(args.tsProject);

let middleware = loadMiddleware(args.middleware);

process.send!({ type: 'WaitingForTests' });

process.on('message', (message: TestProcessMessage) => {
    switch (message.type) {
        case 'RunTests':
            return runTests(message.module);
        case 'Stop':
            return process.exit(ExitCodes.Success);
    }
});

function runTests(module: string) {
    try {
        new TestRunner(middleware, e => process.send!(e)).runTests([module]);
    } catch (error) {
        console.error(error);
        process.exit(ExitCodes.UnexpectedError);
    }

    if (pastMemoryLimit())
        return process.exit(ExitCodes.ExceededMemoryLimit);

    process.send!({ type: 'WaitingForTests' });
}

function pastMemoryLimit() {
    // Stop at 1GB (node's default limit is 1.5GB)
    return process.memoryUsage().rss > Math.pow(2, 30);
}

