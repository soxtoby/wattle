import * as console from 'console';
import { args } from './CommandLineArgs';
import { loadMiddleware, registerTypeScript } from './CommandLineHelpers';
import { TestProcessMessage } from "./TestProcessMessages";
import { TestRunner } from './TestRunner';

registerTypeScript(args.tsProject);

let middleware = loadMiddleware(args.middleware);

process.on('message', (message: TestProcessMessage) => {
    switch (message.type) {
        case 'RunTests':
            return runTests(message.module);
        case 'Stop':
            return process.exit(0);
    }
});

function runTests(module: string) {
    try {
        new TestRunner(middleware, e => process.send!(e)).runTests([module]);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

