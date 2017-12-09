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
            describe: 'One or more globs of test files to run',
            defaultDescription: 'All JavaScript & TypeScript files in the current folder'
        },
        'm': {
            alias: 'middleware',
            array: true,
            type: 'string',
            default: [],
            defaultDescription: 'none',
            describe: 'Add one or more middleware modules'
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

console.log('Found test files:\n' + files.join('\n'));

let loggingMiddleware: ITestMiddleware = {
    collect(test: Test, next: () => void) {
        next();
    },

    run(test: Test, context: ITestContext, next: () => void) {
        next();
        if (test.hasCompleted && !test.parent)
            printTestResult(test);

        function printTestResult(test: Test) {
            if (test.hasPassed) {
                console.log(chalk.green(`${indent(test)}✓ ${test.name}`));
            } else {
                console.log(chalk.red(`${indent(test)}✗ ${test.name}`));
                if (test.error)
                    console.log(`${indent(test)}  ${test.error}`);
            }
            test.children.forEach(printTestResult);
        }
    }
};

function indent(test: Test) {
    return ' '.repeat(test.depth);
}

let counter = new Counter();

let middleware = middlewareModules
    .map(m => require(m).default)
    .concat(loggingMiddleware, counter);

new TestRunner(middleware).runTests(files)
    .then(() => console.log(`Passed: ${counter.passed}  Failed: ${counter.failed}  Total: ${counter.total}`))
    .catch(e => {
        console.error(e);
        process.exit(1);
    });