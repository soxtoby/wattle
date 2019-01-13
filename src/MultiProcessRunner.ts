import { ChildProcess, fork } from "child_process";
import * as os from "os";
import { args, execArgs } from "./CommandLineArgs";
import { ErrorLoadingMiddleware, getLogger, resolveTestFiles } from "./CommandLineHelpers";
import { LogLevel } from "./LogLevel";
import { TestEvent } from "./TestEvents";
import { TestInfoModel } from "./TestInfoModel";

let inspectPort = execArgs.inspect;
let inspectBrkPort = execArgs.inspectBrk;

export function runTests() {
    let allTestFiles = resolveTestFiles(args.testFiles, args._);
    let log = getLogger(args.buildServer, LogLevel[args.verbosity], args.showStacks, allTestFiles);

    let remainingTestFiles = allTestFiles.sort().slice();
    let tests = new TestInfoModel();
    let currentlyRunningModules = {} as { [pid: number]: string };

    let processCount = Math.min(args.processCount || os.cpus().length, allTestFiles.length);
    let testProcesses = Array.from(new Array(processCount), startTestProcess);
    testProcesses.forEach(runNextTestModule);

    function startTestProcess() {
        let execArgv = [];
        if (inspectBrkPort)
            execArgv.push(`--inspect-brk=${++inspectBrkPort}`);
        else if (inspectPort)
            execArgv.push(`--inspect=${++inspectPort}`);

        let testProcess = fork(require.resolve('./TestProcess'), process.argv.slice(2), { execArgv });
        testProcess.on('message', m => onMessage(testProcess, m));
        testProcess.on('exit', (c, s) => onExit(testProcess, c, s));
        return testProcess;
    }

    function onMessage(testProcess: ChildProcess, event: TestEvent) {
        tests.update(event);

        switch (event.type) {
            case 'ModuleStarted':
                log.moduleStarted(event.module);
                break;

            case 'ModuleCompleted':
                log.moduleCompleted(event.module, tests.moduleTests(event.module));
                runNextTestModule(testProcess);
                break;

            case 'TestRun':
                let test = tests.findTest(event.path)!;
                if (test.hasCompleted)
                    log.testCompleted(test);
                break;
        }
    }

    function onExit(testProcess: ChildProcess, code: number, signal: string) {
        if (code == ErrorLoadingMiddleware)
            return process.exit(code);

        testProcesses = testProcesses.filter(p => p != testProcess);
        if (remainingTestFiles.length) {
            let newProcess = startTestProcess();
            testProcesses.push(newProcess);
            runNextTestModule(newProcess);
        } else if (!testProcesses.length)
            done();
    }

    function runNextTestModule(testProcess: ChildProcess) {
        let nextTestModule = remainingTestFiles.shift();
        if (nextTestModule) {
            currentlyRunningModules[testProcess.pid] = nextTestModule;
            testProcess.send({ type: 'RunTests', module: nextTestModule });
        } else {
            testProcess.send({ type: 'Stop' });
        }
    }

    function done() {
        log.finally(tests.allTests);
        process.exit(tests.allTestsPassed ? 0 : 1);
    }
}