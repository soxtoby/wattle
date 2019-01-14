import { ITestContext } from "./Middleware";
import { performance } from "perf_hooks";

export type TestFunction = (this: ITestContext) => any;

export interface ITest {
    name: string;
    fullName: string[];
    testFn: TestFunction;
    parent?: ITest;
    error: any;
    children: ITest[];
    runCount: number;
    duration: number;
    module: string;
    readonly depth: number;
    readonly hasPassed: boolean;
    readonly hasCompleted: boolean;
    run(context: ITestContext): void;
}

export class Test implements ITest {
    constructor(
        public name: string,
        public testFn: TestFunction,
        public parent?: ITest,
        private _module?: string
    ) { }

    error: any;
    children: ITest[] = [];
    runCount: number = 0;
    duration: number = 0;

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