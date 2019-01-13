import { ITest } from "./Test";

export interface ITestContext { }

export interface ITestMiddleware {
    /** Adds a test to the list to be run. */
    collect(test: ITest, next: () => void): void;
    /** Runs a test. Called for each level of the test branch. */
    run(test: ITest, context: ITestContext, next: () => void): void;
    /** Runs the tests in a module. Called once per module. */
    runModule(module: string, next: () => void): void;
}

export class TestMiddleware implements ITestMiddleware {
    collect(test: ITest, next: () => void) { return next(); }
    run(test: ITest, context: ITestContext, next: () => void) { return next(); }
    runModule(module: string, next: () => void) { next(); }
}

export function bindMiddlewareFunction(selectMiddlewareFunction: (middleware: ITestMiddleware) => Function, remainingMiddleware: ITestMiddleware[], ...args: any[]): () => void {
    return remainingMiddleware.length
        ? selectMiddlewareFunction(remainingMiddleware[0]).bind(remainingMiddleware[0], ...args, bindMiddlewareFunction(selectMiddlewareFunction, remainingMiddleware.slice(1), ...args))
        : () => { };
}

export function isMiddleware(value: any): value is ITestMiddleware {
    return value
        && Object.keys(TestMiddleware.prototype).every(m => typeof value[m] == 'function');
}