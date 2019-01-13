import * as console from 'console';
import { relative } from 'path';
import { cwd } from 'process';
import { ITest, ITestInfo } from "./Test";
import { TestLogger } from './TestLogger';

export class TeamCityLogger extends TestLogger {
    moduleStarted(module: string): void {
        this.log('testSuiteStarted', { name: relative(cwd(), module) });
    }

    moduleCompleted(module: string, tests: ITestInfo[]): void {
        this.log('testSuiteFinished', { name: relative(cwd(), module) });
    }

    testCompleted(test: ITestInfo): void {
        let testName = relative(cwd(), test.module) + ':' + test.fullName.join(', ');

        this.log('testStarted', { name: testName });

        if (test.error)
            this.log('testFailed', { name: testName, message: test.error.message, details: test.error.stack });

        this.log('testFinished', { name: testName, duration: test.duration.toFixed(0) });
    }

    private log(messageType: string, attrs: { [key: string]: string }, test?: ITest) {
        let attrsString = Object.keys(attrs)
            .map(key => `${key}='${escape(attrs[key])}'`)
            .join(' ');
        console.log(`##teamcity[${messageType} ${attrsString}]`);

        function escape(value: string) {
            return value
                .replace(/['\|\[\]]/g, "|$&")
                .replace(/\n/g, '|n')
                .replace(/\r/g, '|r');
        }
    }
}