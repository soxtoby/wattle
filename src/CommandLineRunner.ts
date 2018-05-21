import 'ts-node/register';
import * as yargs from 'yargs';
import { getLogger, loadMiddleware, resolveTestFiles } from './CommandLineHelpers';
import { LogLevel } from './LogLevel';
import { TestRunner } from './TestRunner';

interface IArgs {
    _: string[];
    testFiles: string[];
    middleware: string[];
    showStacks: boolean;
    verbosity: keyof typeof LogLevel;
    buildServer: boolean;
}

let args = yargs
    .usage("$0 [--test-files] <test file globs> [options]")
    .options({
        't': {
            alias: 'test-files',
            array: true,
            type: 'string',
            describe: "One or more globs of test files to run.",
            defaultDescription: "All JavaScript & TypeScript files in the current folder"
        },
        'm': {
            alias: 'middleware',
            array: true,
            type: 'string',
            default: [],
            defaultDescription: 'none',
            describe: "Add one or more middleware modules."
        },
        's': {
            alias: 'show-stacks',
            type: 'boolean',
            default: false,
            describe: "Include stack traces in output."
        },
        'v': {
            alias: 'verbosity',
            type: 'string',
            default: 'default',
            describe: "Logging verbosity.",
            choices: ['quiet', 'default', 'full']
        },
        'b': {
            alias: 'build-server',
            type: 'boolean',
            default: false,
            describe: "Output results in a format suitable for a build server."
        }
    })
    .argv as any as IArgs;

let testFiles = resolveTestFiles(args.testFiles, args._);

let middleware = loadMiddleware(args.middleware)
    .concat(getLogger(args.buildServer, LogLevel[args.verbosity], args.showStacks, testFiles));

new TestRunner(middleware).runTests(testFiles)
    .then(results => {
        process.exit(results.every(r => r.hasPassed) ? 0 : 1);
    })
    .catch(e => {
        console.error(e);
        process.exit(1);
    });