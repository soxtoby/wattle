declare module 'node-trx' {
    interface ITestRunOptions {
        name?: string;
        runUser?: string;
        times?: {
            creation?: string,
            queueing?: string,
            start?: string,
            finish?: string
        }
    }

    interface ITestResult {
        test: UnitTest;
        computerName?: string;
        outcome: Outcome,
        duration?: string;
        startTime?: string;
        endTime?: string;
        output?: string;
        errorMessage?: string;
        errorStacktrace?: string;
    }

    type Outcome = 'Passed' | 'Failed' | 'Inconclusive';

    class TestRun {
        constructor(options: ITestRunOptions);

        addResult(result: ITestResult): this;

        toXml(): string;
    }

    interface IUnitTestOptions {
        name: string;
        methodName?: string;
        methodCodeBase?: string;
        methodClassName?: string;
        description?: string;
    }

    class UnitTest { 
        constructor(options: IUnitTestOptions);
    }
}