import * as path from 'path';
import { args } from './CommandLineArgs';
import { fixWindowsPath } from "./CommandLineHelpers";
import { ExitCodes } from './ExitCodes';
import { LogLevel } from './LogLevel';
import { TestRunner } from './TestRunner';
import { combineConfigs, lastConfig } from './TestRunnerConfig';

try {
    require(path.resolve(args.config));
} catch { }

let options = combineConfigs(lastConfig, {
    middleware: args.middleware,
    showStacks: args.showStacks,
    verbosity: args.verbosity && LogLevel[args.verbosity],
    watch: args.watch,
    buildServer: args.buildServer,
    testFiles: (args.testFiles || (args._.length ? args._ : undefined))?.map(fixWindowsPath),
    processCount: args.processCount,
    tsProject: args.tsProject
});

let runner = new TestRunner(options);

let completed: Promise<unknown> = args.watch ? runner.watch() : runner.run();

completed
    .then(() => {
        process.exit(runner.allTestsPassed ? ExitCodes.Success : ExitCodes.TestsFailed);
    })
    .catch(error => {
        if (error == ExitCodes.ErrorLoadingMiddleware)
            return process.exit(ExitCodes.ErrorLoadingMiddleware);

        console.error(error);
        process.exit(ExitCodes.UnexpectedError);
    });