import { ChildProcess, fork } from "child_process";
import * as os from "os";
import { execArgs } from "./CommandLineArgs";
import { ExitCodes } from "./ExitCodes";
import { resolveModule } from "./Path";
import { isTestEvent, TestEvent } from "./TestEvents";
import { TestProcessMessage } from "./TestProcessMessages";
import { ITestRunnerConfig } from "./TestRunnerConfig";

let inspectPort = execArgs.inspect;
let inspectBrkPort = execArgs.inspectBrk;

export class MultiProcessRunner {
    private testFileQueue: string[] = [];
    /** Process -> ready */
    private testProcesses = new Map<ChildProcess, boolean>();
    private currentlyRunningModules: { [pid: number]: string } = {};
    private runs: { files: string[], completed: () => void, errored: (code: ExitCodes) => void }[] = [];

    constructor(
        private config: ITestRunnerConfig,
        private testEventHandler: (event: TestEvent) => void
    ) { }

    run(testFiles: string[]) {
        return new Promise<void>((resolve, reject) => {
            if (!testFiles.length)
                return resolve();

            this.runs.push({ files: testFiles, completed: resolve, errored: reject });

            for (let file of testFiles)
                if (!this.testFileQueue.includes(file))
                    this.testFileQueue.push(file);

            let processCount = Math.min(this.config.processCount, testFiles.length);
            while (this.testProcesses.size < processCount)
                this.startTestProcess();

            this.testProcesses.forEach((ready, testProcess) => {
                if (ready && !(testProcess.pid! in this.currentlyRunningModules))
                    this.runNextTestModule(testProcess);
            });
        });
    }

    startTestProcess() {
        let testProcess = fork(resolveModule('./TestProcess'), [], { execArgv: buildExecArgs() });
        if (os.setPriority)
            os.setPriority(testProcess.pid!, os.constants.priority.PRIORITY_BELOW_NORMAL);
        testProcess.on('message', m => this.onMessage(testProcess, m as TestProcessMessage));
        testProcess.on('exit', (c, s) => this.onExit(testProcess, c!, s!));

        testProcess.send({ type: 'Initialize', config: this.config });

        this.testProcesses.set(testProcess, false);
    }

    onMessage(testProcess: ChildProcess, message: TestProcessMessage) {
        if (isTestEvent(message))
            this.testEventHandler(message);

        switch (message.type) {
            case 'ModuleCompleted':
                delete this.currentlyRunningModules[testProcess.pid!];
                if (this.config.watch) // If not watching, then check on exit
                    this.checkIfRunComplete();
                break;

            case 'WaitingForTests':
                this.testProcesses.set(testProcess, true);
                this.runNextTestModule(testProcess);
                break;
        }
    }

    onExit(testProcess: ChildProcess, code: number, signal: string) {
        if (code == ExitCodes.ErrorLoadingMiddleware) {
            this.runs.forEach(r => r.errored(code));
            this.runs = [];
        } else {
            this.testProcesses.delete(testProcess);
            delete this.currentlyRunningModules[testProcess.pid!];

            this.checkIfRunComplete();

            if (this.testFileQueue.length)
                this.startTestProcess();
        }
    }

    runNextTestModule(testProcess: ChildProcess) {
        let nextTestModule = this.testFileQueue.shift();
        if (nextTestModule) {
            this.currentlyRunningModules[testProcess.pid!] = nextTestModule;
            testProcess.send({ type: 'RunTests', module: nextTestModule });
        } else if (!this.config.watch) {
            testProcess.send({ type: 'Stop' });
        }
    }

    checkIfRunComplete() {
        this.runs = this.runs.filter(run => {
            if (run.files.every(file => !this.testFileQueue.includes(file) && !(Object.values(this.currentlyRunningModules).includes(file))))
                run.completed();
            else
                return true;
        });
    }
}

function buildExecArgs() {
    // Increment inspect port to avoid conflict and to allow VSCode to auto-attach
    if (inspectBrkPort)
        return [`--inspect-brk=${++inspectBrkPort}`];
    if (inspectPort)
        return [`--inspect=${++inspectPort}`];
    return [];
}