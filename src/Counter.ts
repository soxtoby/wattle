import { ITestInfo } from "./Test";
import { TestLogger } from "./TestLogger";

export class Counter extends TestLogger {
    passed = 0;
    failed = 0;
    total = 0;

    testCompleted(test: ITestInfo) {
        if (!test.children.length) {
            this.total++;
            if (test.hasPassed)
                this.passed++;
            else
                this.failed++;
        }
    }
}