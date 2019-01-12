import chalk from 'chalk';
import * as path from 'path';
import { ITestContext, TestMiddleware } from "./Middleware";
import { ITest } from "./Test";
import { Counter } from './Counter';
import logUpdate = require('log-update');
import { LogLevel } from './LogLevel';
import * as console from 'console';

export class ConsoleLogger extends TestMiddleware {
    private counter = new Counter();
    private lastModule = '';

    constructor(
        private logLevel: LogLevel,
        private showStacks: boolean,
        private testFiles: string[]
    ) { super(); }

    run(test: ITest, context: ITestContext, next: () => void) {
        this.counter.run(test, context, next);

        if (test.hasCompleted && !test.parent)
            this.printTestResult(test);

        log(this.counterMessage, true);
    }

    finally(rootTests: ITest[], next: () => void) {
        log(this.counterMessage);
    }

    private get counterMessage() {
        return `Passed: ${this.counter.passed}  Failed: ${this.counter.failed}  Total: ${this.counter.total}`;
    }

    private printTestResult(test: ITest) {
        if (this.logLevel == LogLevel.quiet)
            return;

        if (test.hasPassed) {
            if (this.logLevel >= LogLevel.full) {
                this.logModule(test);
                log(chalk.green(`${indent(test)}✓ ${test.name}` + duration(test)));
            }
        } else {
            this.logModule(test);
            log(chalk.red(`${indent(test)}✗ ${test.name}` + duration(test)));
            if (test.error) {
                let testFrame = stackFrames(test.error)
                    .find(f => this.testFiles.indexOf(f.file) >= 0);
                let errorMessage = this.showStacks && test.error.stack || test.error;
                if (testFrame && testFrame.file)
                    log(`${indent(test)}  ${path.relative('.', testFrame.file)}:${testFrame.line}  ${errorMessage}`);
                else
                    log(`${indent(test)}  ${errorMessage}`);
            }
        }
        test.children.forEach(t => this.printTestResult(t));
    }

    private logModule(test: ITest) {
        if (test.module != this.lastModule) {
            log(test.module);
            this.lastModule = test.module;
        }
    }
}

function log(message: string, updateOnly: boolean = false) {
    if (process.stdout.isTTY) {
        logUpdate(message);
        if (!updateOnly)
            logUpdate.done();
    } else {
        if (!updateOnly)
            console.log(message);
    }
}

function duration(test: ITest) {
    return chalk.grey(` ${test.duration < 1 ? '<1' : test.duration.toFixed(0)}ms`);
}

function stackFrames(error: Error) {
    let framePattern = /\((.*):(\d+):(\d+)\)/g;
    let frame: RegExpExecArray | null;
    let result = [] as { file: string, line: string, col: string }[];
    while (frame = framePattern.exec(error.stack || ''))
        result.push({ file: frame[1], line: frame[2], col: frame[3] });
    return result;
}

function indent(test: ITest) {
    return ' '.repeat(test.depth);
}