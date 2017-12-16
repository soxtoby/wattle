import 'ts-node/register';
import * as yargs from 'yargs';
import * as glob from 'glob';
import * as path from 'path';
import chalk from 'chalk';
import { TestRunner } from './TestRunner';
import { ITestMiddleware, ITestContext } from './Middleware';
import { Test } from './Test';
import { Counter } from './Counter';

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
        }
    })
    .argv;

let fileGlobs = argv.testFiles as string[]
    || argv._.length && argv._
    || ['**/*.@(ts|tsx|js|jsx)', '!node_modules/**', '!**/*.d.ts'];
let testGlobs = fileGlobs.filter(g => g[0] != '!');
let ignoreGlobs = fileGlobs.filter(g => g[0] == '!').map(g => g.substring(1));
let middlewareModules = argv.middleware as string[];

let files = testGlobs
    .map(g => glob.sync(g, { nodir: true, ignore: ignoreGlobs }))
    .reduce((r, fs) => r.concat(fs), [])
    .map(f => path.resolve(f));

class ConsoleLogger implements ITestMiddleware {
    private _loggedModule: { [module: string]: boolean } = {};

    collect(test: Test, next: () => void) {
        next();
    }

    run(test: Test, context: ITestContext, next: () => void) {
        next();
        if (test.hasCompleted && !test.parent) {
            if (!argv.errorsOnly && !this._loggedModule[test.module!]) {
                this._loggedModule[test.module!] = true;
                console.log(test.module);
            }
            printTestResult(test);
        }

        function printTestResult(test: Test) {
            if (test.hasPassed) {
                if (!argv.errorsOnly)
                    console.log(chalk.green(`${indent(test)}✓ ${test.name}`));
            } else {
                console.log(chalk.red(`${indent(test)}✗ ${test.name}`));
                if (test.error) {
                    let testFrame = stackFrames(test.error)
                        .find(f => files.indexOf(f.file) >= 0);
                    if (testFrame)
                        console.log(`${indent(test)}  ${path.relative('.', testFrame.file)}:${testFrame.line}  ${test.error}`);
                    else
                        console.log(`${indent(test)}  ${test.error}`);
                }
            }
            test.children.forEach(printTestResult);
        }
    }
};

function stackFrames(error: Error) {
    let framePattern = /\((.*):(\d+):(\d+)\)$/g;
    let frame: RegExpExecArray | null;
    let result = [] as { file: string, line: string, col: string }[];
    while (frame = framePattern.exec(error.stack || ''))
        result.push({ file: frame[1], line: frame[2], col: frame[3] });
    return result;
}

function indent(test: Test) {
    return ' '.repeat(test.depth);
}

let counter = new Counter();

let middleware = middlewareModules
    .map(m => require(m).default)
    .concat(new ConsoleLogger(), counter);

new TestRunner(middleware).runTests(files)
    .then(() => console.log(`Passed: ${counter.passed}  Failed: ${counter.failed}  Total: ${counter.total}`))
    .catch(e => {
        console.error(e);
        process.exit(1);
    });