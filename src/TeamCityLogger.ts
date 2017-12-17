import { TestMiddleware, ITestContext } from "./Middleware";
import { ITest } from "./Test";

declare module './Test' {
    interface ITest {
        tcFlowId?: string;
    }
}

export class TeamCityLogger extends TestMiddleware {
    private uid = 0;

    runModule(module: string, next: () => void): void {
        this.log('testSuiteStarted', { name: module });
        next();
        this.log('testSuiteFinished', { name: module });
    }

    run(test: ITest, context: ITestContext, next: () => void): void {
        if (!test.tcFlowId) {
            test.tcFlowId = `wattle${this.uid++}`;
            this.log('testStarted', {}, test);
        }

        next();

        if (test.hasCompleted) {
            if (test.error)
                this.log('testFailed', { message: test.error.toString(), details: test.error.stack }, test);

            this.log('testFinished', {}, test);
        }
    }

    private log(messageType: string, attrs: { [key: string]: string }, test?: ITest) {
        if (test) {
            attrs.name = test.name;
            attrs.flowId = test.tcFlowId!;
        }
        let attrsString = Object.keys(attrs)
            .map(key => `${key}='${escape(attrs[key])}'`)
            .join(' ');
        console.log(`##teamcity[${messageType} ${attrsString}]`);

        function escape(value: string) {
            return value
                .replace(/['\|\[\]]/g, "|\0")
                .replace(/\n/g, '|n')
                .replace(/\r/g, '|r');
        }
    }
}

export default new TeamCityLogger();