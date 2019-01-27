import { bindMiddlewareFunction, ITestContext, ITestMiddleware } from "./Middleware";
import { ITest, Test, TestFunction } from "./Test";
import { TestEvent } from "./TestEvents";

let currentTestRun: TestRun | null = null;

export class TestRun {
    private middleware: ITestMiddleware[];
    private currentTest?: ITest;
    private currentTestContext?: ITestContext;
    private isReturningFromTest: boolean = false;
    private importingModule?: string;
    private allModuleTests: { [module: string]: ITest[] } = {};
    private currentModuleTests: ITest[];

    constructor(middleware: ITestMiddleware[] = [], private log: (event: TestEvent) => void = () => { }) {
        this.currentModuleTests = this.allModuleTests[''] = [];
        this.middleware = middleware.concat(this);
    }

    runTests(testModules: string[]) {
        if (currentTestRun != null)
            throw new Error("Test run already in progress");

        currentTestRun = this;

        for (let module of testModules.sort())
            this.doRunModule(module);

        currentTestRun = null;

        return this.allTests;
    }

    get allTests() {
        return Object.entries(this.allModuleTests)
            .reduce((all, [, tests]) => all.concat(tests), [] as ITest[]);
    }

    private doRunModule(module: string) {
        this.log({ type: 'ModuleStarted', module });

        let runModuleFn = bindMiddlewareFunction(m => m.runModule, this.middleware, module);
        runModuleFn();

        this.log({ type: 'ModuleCompleted', module });
    }

    runModule(module: string, next: () => void) {
        this.currentModuleTests = this.allModuleTests[module] = [];
        this.importingModule = module;
        delete require.cache[require.resolve(module)];

        try {
            require(module);
        } catch (error) {
            let failedModule = new Test(module, () => { }, undefined, module);
            failedModule.error = error;
            this.doCollect(failedModule);
            this.doRun(failedModule, {});
            this.currentModuleTests.push(failedModule);
        } finally {
            delete this.importingModule;
        }

        for (let test of this.currentModuleTests)
            this.runTest(test);
    }

    test(name: string, testFn: TestFunction) {
        (testFn as any).displayName = name;

        if (this.currentTestList.find(t => t.name == name) == null) {
            let newTest = new Test(name, testFn, this.currentTest, this.importingModule);
            this.doCollect(newTest);
        }

        let test = this.currentTestList.find(t => t.name == name);

        if (test && !this.importingModule) {
            test.testFn = testFn;
            this.runTest(test);
        }

        return test;
    }

    private runTest(test: ITest) {
        while (!this.isReturningFromTest && !test.hasCompleted)
            this.doRun(test, this.currentTestContext || (this.currentTestContext = {}));
    }

    private doCollect(test: ITest) {
        let collectFn = bindMiddlewareFunction(m => m.collect, this.middleware, test);
        collectFn();
    }

    collect(test: ITest, next: () => void) {
        this.log({ type: 'TestCollected', module: test.module, path: test.fullName.slice(0, -1), name: test.name })
        this.currentTestList.push(test);
    }

    private doRun(test: ITest, context: ITestContext) {
        let runFn = bindMiddlewareFunction(m => m.run, this.middleware, test, context);
        runFn();
    }

    run(test: ITest, context: ITestContext, next: () => void) {
        this.currentTest = test;

        test.run(context);
        this.log({
            type: 'TestRun',
            module: test.module,
            path: test.fullName,
            duration: test.duration,
            error: test.error && { message: test.error.toString(), stack: test.error.stack }
        });

        this.currentTest = test.parent;
        if (!this.currentTest)
            delete this.currentTestContext;
        this.isReturningFromTest = !!this.currentTest;
    }

    private get currentTestList() {
        return this.currentTest && this.currentTest.children
            || this.currentModuleTests;
    }
}

export function runTestWithCurrentRunner(name: string, testFn: TestFunction) {
    if (!currentTestRun)
        throw new Error("Trying to run tests without a test runner");
    currentTestRun.test(name, testFn);
}
