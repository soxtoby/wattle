export type TestEvent =
    ModuleStarted
    | ModuleCompleted
    | TestCollected
    | TestRun;

export interface ModuleStarted {
    type: 'ModuleStarted';
    module: string;
}

export interface ModuleCompleted {
    type: 'ModuleCompleted';
    module: string;
}

export interface TestCollected {
    type: 'TestCollected';
    module?: string;
    /** path of parent */
    path: string[];
    name: string;
}

export interface TestRun {
    type: 'TestRun';
    path: string[];
    duration: number;
    error?: { message: string, stack: string };
}