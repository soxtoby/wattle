import * as yargs from "yargs";
import { LogLevel } from "./LogLevel";

export interface IArgs {
    _: string[];
    config: string;
    testFiles: string[];
    middleware: string[];
    showStacks: boolean;
    verbosity: keyof typeof LogLevel;
    buildServer: boolean;
    processCount: number;
    watch: boolean;
    tsProject: string;
}

export const args = yargs
    .usage("$0 [--test-files] <test file globs> [options]")
    .options({
        'c': {
            alias: 'config',
            type: 'string',
            default: 'wattle.config.js',
            describe: "Path to wattle config file."
        },
        't': {
            alias: 'test-files',
            array: true,
            type: 'string',
            describe: "One or more globs of test files to run.",
            defaultDescription: "All JavaScript & TypeScript files in the current folder."
        },
        'm': {
            alias: 'middleware',
            array: true,
            type: 'string',
            defaultDescription: 'none',
            describe: "Add one or more middleware modules."
        },
        's': {
            alias: 'show-stacks',
            type: 'boolean',
            default: undefined,
            defaultDescription: "don't show stacks",
            describe: "Include stack traces in output."
        },
        'v': {
            alias: 'verbosity',
            type: 'string',
            defaultDescription: "default",
            describe: "Logging verbosity.",
            choices: ['quiet', 'default', 'full']
        },
        'b': {
            alias: 'build-server',
            type: 'boolean',
            default: undefined,
            defaultDescription: "disabled",
            describe: "Output results in a format suitable for a build server."
        },
        'p': {
            alias: 'process-count',
            type: 'number',
            defaultDescription: "1 per CPU core",
            describe: "Number of test processes to use. If 0 is specified, tests will be run synchronously in the main process."
        },
        'w': {
            alias: 'watch',
            type: 'boolean',
            default: undefined,
            defaultDescription: "single run",
            describe: "Keep open after initial test run and re-run tests that have changed."
        },
        'ts-project': {
            type: 'string',
            describe: "Path to custom tsconfig file."
        }
    })
    .argv as any as IArgs;

export const execArgs = yargs.parse(process.execArgv);