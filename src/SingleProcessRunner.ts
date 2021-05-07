import { loadMiddleware, registerTypeScript } from "./CommandLineHelpers";
import { TestEvent } from './TestEvents';
import { TestRun } from "./TestRun";
import { ITestRunnerConfig } from "./TestRunnerConfig";

export class SingleProcessRunner {
    constructor(
        private config: ITestRunnerConfig,
        private testEventHandler: (event: TestEvent) => void
    ) { }

    run(testFiles: string[]) {
        registerTypeScript(this.config.tsProject);

        return new Promise<void>((resolve, reject) => {
            new TestRun(loadMiddleware(this.config.middleware), this.testEventHandler).runTests(testFiles);
            resolve();
        });
    }
}