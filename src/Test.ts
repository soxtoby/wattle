import { ITestContext } from "./Middleware";
import { performance } from "perf_hooks";

export type TestFunction = (this: ITestContext) => any;

export interface ITestBase<T> {
    name: string;
    readonly fullName: string[];
    error?: unknown;
    readonly errorMessage: string | undefined;
    readonly errorStack: string | undefined;
    runCount: number;
    duration: number;
    module: string;
    readonly depth: number;
    readonly hasPassed: boolean;
    readonly hasCompleted: boolean;
    parent?: T;
    readonly children: T[];
}

/** Read-only information about a test  */
export interface ITestInfo extends Readonly<ITestBase<ITestInfo>> { }

/** Run-time test object */
export interface ITest extends ITestBase<ITest> {
    testFn: TestFunction;
    run(context: ITestContext): void;
}

export class TestBase<T extends ITestBase<T>> implements ITestBase<T> {
    constructor(
        public name: string,
        public parent?: T,
        protected _module?: string
    ) { }

    readonly children: T[] = [];
    runCount: number = 0;
    duration: number = 0;

    error?: unknown;

    get errorMessage() {
        return this.error == null
            ? undefined
            : (this.error as any).message as string ?? String(this.error);
    }

    get errorStack() {
        return this.error == null
            ? undefined
            : (this.error as any).stack as string ?? '';
    }

    get module(): string {
        return this._module
            || this.parent && this.parent.module
            || '';
    }

    set module(module: string) {
        this._module = module;
    }

    get fullName(): string[] {
        return this.parent
            ? this.parent.fullName.concat(this.name)
            : [this.name];
    }

    get depth(): number {
        return this.parent ? this.parent.depth + 1 : 0;
    }

    get hasPassed(): boolean {
        return this.hasCompleted
            && !this.error
            && this.children.every(c => c.hasPassed);
    }

    get hasCompleted(): boolean {
        return !!this.runCount
            && (!!this.error
                || this.children.every(c => c.hasCompleted));
    }
}

export class TestInfo extends TestBase<TestInfo> { }

export class Test extends TestBase<ITest> {
    constructor(
        name: string,
        public testFn: TestFunction,
        parent?: ITest,
        _module?: string
    ) {
        super(name, parent, _module);
    }

    run(context: ITestContext) {
        this.runCount++;
        let start = performance.now();

        try {
            this.testFn.call(context);
        } catch (error) {
            this.error = error;
        }

        let end = performance.now();
        this.duration += end - start;
    }
}