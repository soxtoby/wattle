import * as chalk from 'chalk';
import { Chalk } from 'chalk';
import * as console from 'console';
import * as path from 'path';
import { performance } from 'perf_hooks';
import { Counter } from './Counter';
import { LogLevel } from './LogLevel';
import { ITestInfo } from "./Test";
import { TestLogger } from './TestLogger';
import logUpdate = require('log-update');

export class ConsoleLogger extends TestLogger {
    private counter = new Counter();
    private lastModule = '';
    private completedModules = 0;
    private started: number;
    private progressLastUpdated = 0;

    constructor(
        private logLevel: LogLevel,
        private showStacks: boolean,
        private testFiles: string[]
    ) {
        super();
        this.started = performance.now();
    }

    testCompleted(test: ITestInfo) {
        this.counter.testCompleted(test);
        this.updateProgress();
    }

    moduleCompleted(module: string, tests: ITestInfo[]) {
        this.completedModules++;
        tests.forEach(t => this.printTestResult(t));
    }

    finally(rootTests: ITestInfo[]) {
        log(`${this.counterMessage}\nCompleted in ${timespan(performance.now() - this.started)}`);
    }

    private printTestResult(test: ITestInfo) {
        if (this.logLevel == LogLevel.quiet)
            return;

        if (test.hasPassed) {
            if (this.logLevel >= LogLevel.full) {
                this.logModule(test);
                log(`${indent(test)}${chalk.green('✓')} ${chalk.white(test.name)}` + duration(test));
                this.updateProgress(true);
            }
        } else {
            this.logModule(test);
            log(`${indent(test)}${chalk.redBright.bold('✗')} ${chalk.whiteBright(test.name)}` + duration(test));
            if (test.error) {
                let testFrame = stackFrames(test.error.stack)
                    .find(f => this.testFiles.indexOf(f.file) >= 0);
                let errorMessage = this.showStacks && test.error.stack || test.error.message;
                if (testFrame && testFrame.file)
                    log(`${indent(test)}  ${path.relative('.', testFrame.file)}:${testFrame.line}  ${errorMessage}`);
                else
                    log(`${indent(test)}  ${errorMessage}`);
            }
            this.updateProgress(true);
        }
        test.children.forEach(t => this.printTestResult(t));
    }

    private logModule(test: ITestInfo) {
        if (test.module != this.lastModule) {
            log(test.module);
            this.lastModule = test.module;
        }
    }

    private updateProgress(force = false) {
        let now = performance.now();
        if (force || now - this.progressLastUpdated > 80) {
            this.progressLastUpdated = now;
            let completed = this.completedModules;
            let total = this.testFiles.length;
            let bar = progressBar(completed, total, this.counter.failed ? chalk.red : chalk.green);
            let elapsed = timespan(now - this.started);
            let remaining = timespan((now - this.started) / completed * (total - completed));
            log(`${this.counterMessage}\n${bar} ${elapsed} | ${remaining}`, true);
        }
    }

    private get counterMessage() {
        return `${chalk.white('Passed:')} ${chalk.whiteBright(this.counter.passed.toString())}`
            + `  ${chalk.white('Failed:')} ${chalk.whiteBright(this.counter.failed.toString())}`
            + `  ${chalk.white('Total:')} ${chalk.whiteBright(this.counter.total.toString())}`;
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

function duration(test: ITestInfo) {
    return chalk.grey(` ${test.duration < 1 ? '<1' : test.duration.toFixed(0)}ms`);
}

function progressBar(value: number, total: number, color: Chalk) {
    let width = 50;
    let complete = value / total * width;
    let full = '█'.repeat(Math.floor(complete));
    let partial = complete % 1 >= 0.5 ? '▌' : '';
    let remaining = '█'.repeat(width - full.length - partial.length);
    return color(full) + color.bgWhite(partial) + chalk.white(remaining);
}

function timespan(millliseconds: number) {
    let minutes = Math.floor(millliseconds / 1000 / 60);
    let seconds = millliseconds / 1000 - minutes * 60;
    return minutes ? `${minutes}:${seconds.toFixed(0).padStart(2, '0')}m` : `${seconds.toFixed(1)}s`;
}

function stackFrames(stack: string) {
    let framePattern = /\((.*):(\d+):(\d+)\)/g;
    let frame: RegExpExecArray | null;
    let result = [] as { file: string, line: string, col: string }[];
    while (frame = framePattern.exec(stack || ''))
        result.push({ file: frame[1], line: frame[2], col: frame[3] });
    return result;
}

function indent(test: ITestInfo) {
    return ' '.repeat(test.depth);
}
