import { Test, TestFunction } from "./Test";
import { ITestMiddleware, ITestContext, bindMiddlewareFunction } from "./Middleware";
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

class TestRun implements ITestMiddleware {
    public rootTests: Test[] = [];
    private currentTest?: Test;
    private currentTestContext?: ITestContext;
    private isReturningFromTest: boolean = false;

    constructor(
        private middleware: ITestMiddleware[] = []
    ) { }

    async runTests(testModules: string[]) {
        for (const module of testModules) {
            try {
                await import(module);
            } catch (error) {
                let failedModule = new Test(module, () => { });
                failedModule.error = error;
                this.collectMiddleware(failedModule);
                this.runMiddleware(failedModule, {});
                this.rootTests.push(failedModule)
            }
        }

        return this.rootTests;
    }

    test(name: string, testFn: TestFunction) {
        (testFn as any).displayName = name;

        if (this.currentTestList.find(t => t.name == name) == null) {
            let newTest = new Test(name, testFn, this.currentTest);
            this.collectMiddleware(newTest);
        }

        let test = this.currentTestList.find(t => t.name == name);

        if (test) {
            test.testFn = testFn;
            while (!this.isReturningFromTest && !test.hasCompleted)
                this.runMiddleware(test, this.currentTestContext || (this.currentTestContext = {}));
        }

        return test;
    }

    private collectMiddleware(test: Test) {
        let collectFn = bindMiddlewareFunction(m => m.collect, this.middleware.concat(this), test);
        collectFn();
    }

    private runMiddleware(test: Test, context: ITestContext) {
        let runFn = bindMiddlewareFunction(m => m.run, this.middleware.concat(this), test, context);
        runFn();
    }

    collect(test: Test, next: () => void) {
        this.currentTestList.push(test);
    }

    run(test: Test, context: ITestContext, next: () => void) {
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