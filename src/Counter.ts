import { TestMiddleware, ITestContext } from "./Middleware";
import { Test } from "./Test";

export class Counter extends TestMiddleware {
    passed = 0;
    failed = 0;
    total = 0;

    run(test: Test, context: ITestContext, next: () => void) {
        next();
        if (test.hasCompleted && !test.children.length) {
            this.total++;
            if (test.hasPassed)
            this.passed++;
            else
                this.failed++;
        }
    }
}

export default new Counter();