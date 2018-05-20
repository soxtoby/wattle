import * as trx from 'node-trx';
import { TestMiddleware } from "./Middleware";
import { ITest } from "./Test";
import { writeFileSync } from 'fs';
import { UnitTest } from 'node-trx';
import { relative } from 'path';
import * as process from 'process';
import * as os from 'os';

export class TfsLogger extends TestMiddleware {
    finally(rootTests: ITest[], next: () => void) {
        next();

        let cwd = process.cwd();
        let hostname = os.hostname();

        let testRun = new trx.TestRun({
            name: 'wattle test run'
        });
        rootTests.forEach(addResults);
        writeFileSync('./wattle-results.trx', testRun.toXml());

        function addResults(test: ITest) {
            if (test.children.length)
                test.children.forEach(addResults);
            else
                testRun.addResult({
                    test: new UnitTest({
                        name: test.fullName.join(', '),
                        methodCodeBase: 'wattle',
                        methodClassName: relative(cwd, test.module),
                        methodName: test.name
                    }),
                    duration: duration(test.duration),
                    outcome: test.hasPassed ? 'Passed' : 'Failed',
                    computerName: hostname
                });
        }

        function duration(ms: number) {
            let date = new Date(ms);
            let hours = pad(date.getUTCHours());
            let minutes = pad(date.getUTCMinutes());
            let seconds = pad(date.getUTCSeconds()) + String(date.getUTCMilliseconds() / 1000).substr(1);
            return `${hours}:${minutes}:${seconds}`;
        }

        function pad(number: number) {
            return String(number).padStart(2, '0');
        }
    }
}

export default new TfsLogger();