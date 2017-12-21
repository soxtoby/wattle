import { Test, TestFunction, ITest } from "./Test";
import { ITestMiddleware, ITestContext, bindMiddlewareFunction, TestMiddleware } from "./Middleware";
import { fail } from "assert";

let currentTestRun: TestRun | null = null;

export class TestRunner {
    private run: TestRun;

    constructor(middleware: ITestMiddleware[] = []) {
        this.run = new TestRun(middleware);
    }

    async runTests(testModules: string[]) {
        if (currentTestRun != null)
            throw new Error("Test run already in progress");

        currentTestRun = this.run;

        let results = await currentTestRun.runTests(testModules);

        currentTestRun = null;

        return results;
    }

    test(name: string, testFn: TestFunction) {
        return this.run.test(name, testFn);
    }

    get rootTests() { return this.run.rootTests; }
}

class TestRun extends TestMiddleware {
    public rootTests: ITest[] = [];
    private rootTestsByModule: { [module: string]: ITest[] } = {};
    private currentTest?: ITest;
    private currentTestContext?: ITestContext;
    private isReturningFromTest: boolean = false;
    private importingModule?: string;

    constructor(
        private middleware: ITestMiddleware[] = []
    ) {
        super();
        this.middleware = this.middleware.concat([this]);
    }

    async runTests(testModules: string[]) {
        // Load test modules first before running tests
        // VS Code breakpoints don't work if tests are run during first load
        for (let module of testModules) {
            try {
                this.importingModule = module;
                await import(module);
            } catch (error) {
                let failedModule = new Test(module, () => { });
                failedModule.error = error;
                this.doCollect(failedModule);
                this.doRun(failedModule, {});
                this.rootTests.push(failedModule)
            } finally {
                delete this.importingModule;
            }
        }

        for (let test of this.rootTests)
            (this.rootTestsByModule[test.module] || (this.rootTestsByModule[test.module] = [])).push(test);

        for (let module of Object.keys(this.rootTestsByModule).sort())
            this.doRunModule(module);

        this.doFinally(this.rootTests);

        return this.rootTests;
    }

    private doRunModule(module: string) {
        let runModuleFn = bindMiddlewareFunction(m => m.runModule, this.middleware, module);
        runModuleFn();
    }

    runModule(module: string, next: () => void) {
        for (let test of this.rootTestsByModule[module] || [])
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

    private doRun(test: ITest, context: ITestContext) {
        let runFn = bindMiddlewareFunction(m => m.run, this.middleware, test, context);
        runFn();
    }

    private doFinally(rootTests: ITest[]) {
        let finallyFn = bindMiddlewareFunction(m => m.finally, this.middleware, rootTests);
        finallyFn();
    }

    collect(test: ITest, next: () => void) {
        this.currentTestList.push(test);
    }

    run(test: ITest, context: ITestContext, next: () => void) {
        this.currentTest = test;

        test.run(context);

        this.currentTest = test.parent;
        if (!this.currentTest)
            delete this.currentTestContext;
        this.isReturningFromTest = !!this.currentTest;
    }

    private get currentTestList() {
        return this.currentTest && this.currentTest.children
            || this.rootTests;
    }
}

export function runTestWithCurrentRunner(name: string, testFn: TestFunction) {
    if (!currentTestRun)
        throw new Error("Trying to run tests without a test runner");
    currentTestRun.test(name, testFn);
}