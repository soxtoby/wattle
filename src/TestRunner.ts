import * as glob from 'fast-glob';
import { AppVeyorLogger } from './AppVeyorLogger';
import { ConsoleLogger } from './ConsoleLogger';
import { LogLevel } from "./LogLevel";
import { MultiProcessRunner } from './MultiProcessRunner';
import { SingleProcessRunner } from './SingleProcessRunner';
import { TeamCityLogger } from './TeamCityLogger';
import { TestEvent } from './TestEvents';
import { TestInfoModel } from './TestInfoModel';
import { ITestLogger } from './TestLogger';
import { TfsLogger } from './TfsLogger';
import { ITestRunnerConfig, defaults } from './TestRunnerConfig';

export class TestRunner {
    private config: ITestRunnerConfig;
    private tests = new TestInfoModel();

    constructor(options?: Partial<ITestRunnerConfig>) {
        this.config = Object.assign({}, defaults, options || {});
    }

    get allTests() { return this.tests.allTests; }
    get allTestsPassed() { return this.tests.allTestsPassed; }

    async run() {
        let allTestFiles = await resolveTestFiles(this.config.testFiles);
        let log = getLogger(this.config.buildServer, this.config.verbosity, this.config.showStacks, allTestFiles);

        let onTestEvent = (event: TestEvent) => {
            this.tests.update(event);

            switch (event.type) {
                case 'ModuleStarted':
                    log.moduleStarted(event.module);
                    break;
                case 'ModuleCompleted':
                    log.moduleCompleted(event.module, this.tests.moduleTests(event.module));
                    break;
                case 'TestRun':
                    let test = this.tests.findTest(event.module, event.path)!;
                    if (test.hasCompleted)
                        log.testCompleted(test);
                    break;
            }
        }

        let runner = this.config.processCount
            ? new MultiProcessRunner(this.config, onTestEvent)
            : new SingleProcessRunner(this.config, onTestEvent);

        await runner.run(allTestFiles);

        log.finally(this.tests.allTests);
    }
}

function resolveTestFiles(fileGlobs: string[]) {
    fileGlobs = fileGlobs.concat('!**/*.d.ts'); // No one wants to test .d.ts files
    return glob(fileGlobs, { onlyFiles: true, absolute: true }) as Promise<string[]>;
}

function getLogger(buildServer: boolean, logLevel: LogLevel, showStacks: boolean, testFiles: string[]): ITestLogger {
    if (buildServer) {
        return process.env.APPVEYOR_API_URL ? new AppVeyorLogger()
            : process.env.TEAMCITY_VERSION ? new TeamCityLogger()
                : new TfsLogger();
    }
    return new ConsoleLogger(logLevel, showStacks, testFiles);
}