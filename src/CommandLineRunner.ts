import { args } from './CommandLineArgs';
import { ExitCodes } from './ExitCodes';
import { LogLevel } from './LogLevel';
import { TestRunner } from './TestRunner';
import { ITestRunnerConfig } from './TestRunnerConfig';

let options: Partial<ITestRunnerConfig> = {
    middleware: args.middleware,
    showStacks: args.showStacks,
    verbosity: LogLevel[args.verbosity],
    watch: args.watch,
    buildServer: args.buildServer
};
if (args.testFiles)
    options.testFiles = args.testFiles;
else if (args._.length)
    options.testFiles = args._;
if (args.processCount != null)
    options.processCount = args.processCount;
if (args.tsProject)
    options.tsProject = args.tsProject;

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