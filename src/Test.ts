import { ITestContext } from "./Middleware";

export type TestFunction = () => any;

export class Test {
    constructor(
        public name: string,
        public testFn: TestFunction,
        public parent?: Test
    ) { }

    error: any;
    children: Test[] = [];
    runCount: number = 0;

    run(context: ITestContext) {
        this.runCount++;

        try {
            this.testFn.call(context);
        } catch (error) {
            this.error = error;
        }
    }

    get hasCompleted(): boolean {
        return !!this.runCount
            && (!!this.error
                || this.children.every(c => c.hasCompleted));
    }

    get depth(): number {
        return this.parent ? this.parent.depth + 1 : 0;
    }

    get hasPassed(): boolean {
        return this.hasCompleted
            && !this.error
            && this.children.every(c => c.hasPassed);
    }
}