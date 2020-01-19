import * as chokidar from 'chokidar';
import * as glob from 'fast-glob';
import * as path from 'path';
import { AppVeyorLogger } from './AppVeyorLogger';
import { ConsoleLogger } from './ConsoleLogger';
import { LogLevel } from "./LogLevel";
import { DependencyWatcher } from './ModuleDependencies';
import { MultiProcessRunner } from './MultiProcessRunner';
import { SingleProcessRunner } from './SingleProcessRunner';
import { TeamCityLogger } from './TeamCityLogger';
import { ITestInfo } from './Test';
import { TestEvent } from './TestEvents';
import { TestInfoModel } from './TestInfoModel';
import { ITestLogger } from './TestLogger';
import { defaults, ITestRunnerConfig } from './TestRunnerConfig';
import { TfsLogger } from './TfsLogger';

export class TestRunner {
    private readonly config: ITestRunnerConfig;
    private readonly tests = new TestInfoModel();
    private readonly testQueue = new Set<string>();
    private readonly runner: MultiProcessRunner | SingleProcessRunner;
    private readonly dependencyWatcher = new DependencyWatcher(files => this.addToQueue(files));
    private timeout?: NodeJS.Timeout;
    private log!: ITestLogger;
    private isWatching = false;
    private isRunning = false;
    private onError?: (error: any) => void;

    constructor(options?: Partial<ITestRunnerConfig>) {
        this.config = Object.assign({}, defaults, options || {});
        this.config.testFiles.push('!**/*.d.ts'); // No one wants to test .d.ts files

        this.runner = this.config.processCount
            ? new MultiProcessRunner(this.config, e => this.onTestEvent(e))
            : new SingleProcessRunner(this.config, e => this.onTestEvent(e));
    }

    async run(testFileGlobs = this.config.testFiles) {
        return this.runFiles(await resolveTestFiles(testFileGlobs));
    }

    async watch(testFileGlobs = this.config.testFiles) {
        if (this.isWatching)
            throw new Error("Already watching");
        this.isWatching = true;

        let matchGlobs = getMatchGlobs(testFileGlobs);
        let ignoreGlobs = getIgnoreGlobs(testFileGlobs);

        let watcher: chokidar.FSWatcher = chokidar.watch(matchGlobs,
            {
                ignoreInitial: true,
                ignored: ignoreGlobs,
                awaitWriteFinish: true,
                atomic: true
            })
            .on('ready', () => this.initialRun(watcher.getWatched()))
            .on('add', file => this.onFileAdded(file))
            .on('change', file => this.onFileChanged(file))
            .on('unlink', file => this.onFileRemoved(file));

        this.dependencyWatcher.start();

        try {
            await new Promise((_, reject) => this.onError = reject);
        } finally {
            this.isWatching = false;
            watcher.close();
            this.dependencyWatcher.stop();
        }
    }

    get anyTests() { return !!this.tests.allTests.length; }

    get allTestsPassed() { return this.tests.allTestsPassed; }

    private initialRun(watchedDirs: Record<string, string[]>) {
        let files = Object.entries(watchedDirs)
            .reduce((all, [dir, files]) => all.concat(files.map(f => path.join(dir, f))), [] as string[])
            .filter(f => !(f in watchedDirs))
            .map(f => path.resolve(f));
        this.addToQueue(files);
    }

    private onFileAdded(file: string) {
        file = path.resolve(file);
        this.addToQueue([file]);
    }

    private onFileChanged(file: string) {
        this.addToQueue([path.resolve(file)]);
    }

    private onFileRemoved(file: string) {
        file = path.resolve(file);
        this.testQueue.delete(file);

        if (!this.testQueue.size && this.timeout)
            clearTimeout(this.timeout);
    }

    private addToQueue(testFiles: string[]) {
        testFiles.forEach(f => this.testQueue.add(f));
        if (!this.isRunning)
            this.delayedRunTestsInQueue();
    }

    private delayedRunTestsInQueue() {
        if (this.timeout)
            clearTimeout(this.timeout);
        this.timeout = setTimeout(() => this.runTestsInQueue(), 100);
    }

    private async runTestsInQueue() {
        let testFiles = Array.from(this.testQueue);
        this.testQueue.clear();

        try {
            await this.runFiles(testFiles);

            if (this.testQueue.size)
                this.delayedRunTestsInQueue();
        } catch (error) {
            if (this.onError)
                this.onError(error);
        }
    }

    private async runFiles(testFiles: string[]) {
        if (this.isRunning)
            throw new Error("Already running tests");

        this.log = getLogger(this.config.buildServer, this.config.verbosity, this.config.showStacks, testFiles);

        try {
            this.isRunning = true;
            await this.runner.run(testFiles);

            let results = testFiles.reduce((ts, m) => ts.concat(this.tests.moduleTests(m)), [] as ITestInfo[]);
            this.log.finally(results);
            return results;
        } finally {
            this.isRunning = false;
        }
    }

    private onTestEvent(event: TestEvent) {
        this.tests.update(event);

        switch (event.type) {
            case 'ModuleStarted':
                this.log.moduleStarted(event.module);
                break;
            case 'ModuleCompleted':
                this.log.moduleCompleted(event.module, this.tests.moduleTests(event.module));
                this.dependencyWatcher.updateDependencies(event.module, event.dependencies);
                break;
            case 'TestRun':
                let test = this.tests.findTest(event.module, event.path)!;
                if (test.hasCompleted)
                    this.log.testCompleted(test);
                break;
        }
    }
}

function getIgnoreGlobs(testFiles: string[]) {
    return testFiles.filter(g => g.startsWith('!')).map(g => g.substring(1));
}

function getMatchGlobs(testFiles: string[]) {
    return testFiles.filter(g => !g.startsWith('!'));
}

async function resolveTestFiles(fileGlobs: string[]) {
    let files = await glob(fileGlobs, { onlyFiles: true, absolute: true });
    return files.map(path.normalize);
}

function getLogger(buildServer: boolean, logLevel: LogLevel, showStacks: boolean, testFiles: string[]): ITestLogger {
    if (buildServer) {
        return process.env.APPVEYOR_API_URL ? new AppVeyorLogger()
            : process.env.TEAMCITY_VERSION ? new TeamCityLogger()
                : new TfsLogger();
    }
    return new ConsoleLogger(logLevel, showStacks, testFiles);
}