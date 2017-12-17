import * as trx from 'node-trx';
import { TestMiddleware } from "./Middleware";
import { ITest } from "./Test";
import { writeFileSync } from 'fs';
import { UnitTest } from 'node-trx';

export class TfsLogger extends TestMiddleware {
    finally(rootTests: ITest[], next: () => void) {
        next();

        let testRun = new trx.TestRun({});
        rootTests.forEach(addResults);
        writeFileSync('./wattle-results.trx', testRun.toXml());

        function addResults(test: ITest) {
            if (test.children.length)
                test.children.forEach(addResults);
            else
                testRun.addResult({
                    test: new UnitTest({
                        name: test.fullName.join(', '),
                        methodCodeBase: test.module
                    }),
                    outcome: test.hasPassed ? 'Passed' : 'Failed'
                });
        }
    }
}

export default new TfsLogger();