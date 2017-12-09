import { Test } from "./Test";

export interface ITestContext { }

export interface ITestMiddleware {
    collect(test: Test, next: () => void): void;
    run(test: Test, context: ITestContext, next: () => void): void;
}

export abstract class TestMiddleware implements ITestMiddleware {
    collect(test: Test, next: () => void) { return next(); }
    run(test: Test, context: ITestContext, next: () => void) { return next(); }
}

export function bindMiddlewareFunction(selectMiddlewareFunction: (middleware: ITestMiddleware) => Function, remainingMiddleware: ITestMiddleware[], ...args: any[]): () => void {
    return remainingMiddleware.length
        ? selectMiddlewareFunction(remainingMiddleware[0]).bind(remainingMiddleware[0], ...args, bindMiddlewareFunction(selectMiddlewareFunction, remainingMiddleware.slice(1), ...args))
        : () => { };
}