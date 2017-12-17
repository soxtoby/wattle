import chalk from 'chalk';
import * as path from 'path';
import { ITestContext, TestMiddleware } from "./Middleware";
import { ITest } from "./Test";
import { Counter } from './Counter';

export class ConsoleLogger extends TestMiddleware {
    private counter = new Counter();

    constructor(
        private errorsOnly: boolean,
        private testFiles: string[]
    ) { super(); }

    runModule(module: string, next: () => void): void {
        console.log(module);
        next();
    }

    run(test: ITest, context: ITestContext, next: () => void) {
        this.counter.run(test, context, next);
        if (test.hasCompleted && !test.parent)
            this.printTestResult(test);
    }

    private printTestResult(test: ITest) {
        if (test.hasPassed) {
            if (!this.errorsOnly)
                console.log(chalk.green(`${indent(test)}✓ ${test.name}`));
        } else {
            console.log(chalk.red(`${indent(test)}✗ ${test.name}`));
            if (test.error) {
                let testFrame = stackFrames(test.error)
                    .find(f => this.testFiles.indexOf(f.file) >= 0);
                if (testFrame)
                    console.log(`${indent(test)}  ${path.relative('.', testFrame.file)}:${testFrame.line}  ${test.error}`);
                else
                    console.log(`${indent(test)}  ${test.error}`);
            }
        }
        test.children.forEach(t => this.printTestResult(t));
    }

    finally(rootTests: ITest[], next: () => void) {
        console.log(`Passed: ${this.counter.passed}  Failed: ${this.counter.failed}  Total: ${this.counter.total}`)
    }
}

function stackFrames(error: Error) {
    let framePattern = /\((.*):(\d+):(\d+)\)$/g;
    let frame: RegExpExecArray | null;
    let result = [] as { file: string, line: string, col: string }[];
    while (frame = framePattern.exec(error.stack || ''))
        result.push({ file: frame[1], line: frame[2], col: frame[3] });
    return result;
}

function indent(test: ITest) {
    return ' '.repeat(test.depth);
}