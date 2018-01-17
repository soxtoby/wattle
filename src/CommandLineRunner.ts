import 'ts-node/register';
import * as yargs from 'yargs';
import * as glob from 'glob';
import * as path from 'path';
import chalk from 'chalk';
import { TestRunner } from './TestRunner';
import { ITestMiddleware, ITestContext } from './Middleware';
import { Test } from './Test';
import { Counter } from './Counter';
import { ConsoleLogger } from './ConsoleLogger';
import { BuildServerLogger } from './BuildServerLogger';

let argv = yargs
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
        'e': {
            alias: 'errors-only',
            type: 'boolean',
            default: false,
            describe: "Only output errors. Useful when you've got a lot of tests."
        },
        'q': {
            alias: 'quiet',
            type: 'boolean',
            default: false,
            describe: "Only output final results."
        },
        'b': {
            alias: 'build-server',
            type: 'boolean',
            default: false,
            describe: "Output results in a format suitable for a build server."
        }
    })
    .argv;

let fileGlobs = argv.testFiles as string[]
    || argv._.length && argv._
    || ['**/*.@(ts|tsx|js|jsx)', '!node_modules/**'];
fileGlobs.push('!./**/*.d.ts'); // No one wants to test .d.ts files
let testGlobs = fileGlobs.filter(g => g[0] != '!');
let ignoreGlobs = fileGlobs.filter(g => g[0] == '!').map(g => g.substring(1));
let middlewareModules = argv.middleware as string[];

let files = testGlobs
    .map(g => glob.sync(g, { nodir: true, ignore: ignoreGlobs }))
    .reduce((r, fs) => r.concat(fs), [])
    .map(f => path.resolve(f));

let counter = new Counter();

let logger = argv.buildServer
    ? new BuildServerLogger()
    : new ConsoleLogger(argv.errorsOnly, argv.quiet, files);

let middleware = middlewareModules
    .map(m => require(m).default)
    .concat(logger, counter);

new TestRunner(middleware).runTests(files)
    .then(results => {
        process.exit(results.every(r => r.hasPassed) ? 0 : 1);
    })
    .catch(e => {
        console.error(e);
        process.exit(1);
    });