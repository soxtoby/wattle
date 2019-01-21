import { args } from "./CommandLineArgs";
import { getLogger, loadMiddleware, registerTypeScript, resolveTestFiles } from "./CommandLineHelpers";
import { LogLevel } from "./LogLevel";
import { TestEvent } from './TestEvents';
import { TestInfoModel } from './TestInfoModel';
import { TestRunner } from "./TestRunner";

export function runTests() {
    registerTypeScript(args.tsProject);

    let allTestFiles = resolveTestFiles(args.testFiles, args._);
    let log = getLogger(args.buildServer, LogLevel[args.verbosity], args.showStacks, allTestFiles);

    let tests = new TestInfoModel();

    try {
        new TestRunner(loadMiddleware(args.middleware), onMessage).runTests(allTestFiles);
        log.finally(tests.allTests);
        process.exit(tests.allTestsPassed ? 0 : 1);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }

    function onMessage(event: TestEvent) {
        tests.update(event);

        switch (event.type) {
            case 'ModuleStarted':
                log.moduleStarted(event.module);
                break;
            case 'ModuleCompleted':
                log.moduleCompleted(event.module, tests.moduleTests(event.module));
                break;
            case 'TestRun':
                let test = tests.findTest(event.module, event.path)!;
                if (test.hasCompleted)
                    log.testCompleted(test);
                break;
        }
    }
}