import * as yargs from 'yargs';
import { LogLevel } from "./LogLevel";

export interface IArgs {
    _: string[];
    testFiles: string[];
    middleware: string[];
    showStacks: boolean;
    verbosity: keyof typeof LogLevel;
    buildServer: boolean;
    processCount: number;
    tsProject: string;
}

export const args = yargs
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
        },
        'p': {
            alias: 'process-count',
            type: 'number',
            defaultDescription: "1 per CPU core",
            describe: "Number of test processes to use. If 0 is specified, tests will be run synchronously in the main process"
        },
        'ts-project': {
            type: 'string',
            describe: "Path to custom tsconfig file."
        }
    })
    .argv as any as IArgs;

export const execArgs = yargs.parse(process.execArgv);