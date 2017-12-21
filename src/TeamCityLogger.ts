import { TestMiddleware, ITestContext } from "./Middleware";
import { ITest } from "./Test";
import { relative } from 'path';
import { cwd } from 'process';

export class TeamCityLogger extends TestMiddleware {
    runModule(module: string, next: () => void): void {
        let relativeModule = relative(cwd(), module);
        this.log('testSuiteStarted', { name: relativeModule });
        next();
        this.log('testSuiteFinished', { name: relativeModule });
    }

    run(test: ITest, context: ITestContext, next: () => void): void {
        next();

        if (test.hasCompleted && !test.children.length || test.error) {
            let testName: string = test.fullName.join(', ');

            this.log('testStarted', { name: testName, captureStandardOutput: 'true' });

            if (test.error)
                this.log('testFailed', { name: testName, message: test.error.toString(), details: test.error.stack });

            this.log('testFinished', { name: testName, duration: test.duration.toFixed(0) });
        }
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

export default new TeamCityLogger();