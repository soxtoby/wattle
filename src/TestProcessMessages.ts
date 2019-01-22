import { TestEvent } from "./TestEvents";

export type TestProcessMessage =
    RunTests
    | Stop
    | WaitingForTests
    | TestEvent;

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