import { TestEvent } from "./TestEvents";
import { ITestRunnerConfig } from "./TestRunnerConfig";

export type TestProcessMessage =
    WaitingForTests
    | TestEvent;

export type TestRunnerMessage =
    Initialize
    | RunTests
    | Stop;

export interface Initialize {
    type: 'Initialize',
    config: ITestRunnerConfig
}

export interface RunTests {
    type: 'RunTests';
    module: string;
}

export interface Stop {
    type: 'Stop'
}

export interface WaitingForTests {
    type: 'WaitingForTests'
}