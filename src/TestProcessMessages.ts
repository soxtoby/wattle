export type TestProcessMessage =
    RunTests
    | Stop;

export interface RunTests {
    type: 'RunTests';
    module: string;
}

export interface Stop {
    type: 'Stop'
}