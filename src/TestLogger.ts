import { ITestInfo } from "./Test";

export interface ITestLogger {
    /** Called after a test has completed. */
    testCompleted(test: ITestInfo): void;
    /** Called before a test module is loaded. */
    moduleStarted(module: string): void;
    /** Called after a test module has finished running. */
    moduleCompleted(module: string, tests: ITestInfo[]): void;
    /** Called at the very end of the test run. */
    finally(rootTests: ITestInfo[]): void;
}

export class TestLogger implements ITestLogger {
    testCompleted(test: ITestInfo) { }
    moduleStarted(module: string) { }
    moduleCompleted(module: string, tests: ITestInfo[]) { }
    finally(rootTests: ITestInfo[]) { }
}