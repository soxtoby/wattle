import { ITest } from "./Test";

export interface ITestContext { }

export interface ITestMiddleware {
    collect(test: ITest, next: () => void): void;
    run(test: ITest, context: ITestContext, next: () => void): void;
    runModule(module: string, next: () => void): void;
    finally(rooTests: ITest[], next: () => void): void;
}

export class TestMiddleware implements ITestMiddleware {
    collect(test: ITest, next: () => void) { return next(); }
    run(test: ITest, context: ITestContext, next: () => void) { return next(); }
    runModule(module: string, next: () => void) { next(); }
    finally(rootTests: ITest[], next: () => void) { next(); }
}

export function bindMiddlewareFunction(selectMiddlewareFunction: (middleware: ITestMiddleware) => Function, remainingMiddleware: ITestMiddleware[], ...args: any[]): () => void {
    return remainingMiddleware.length
        ? selectMiddlewareFunction(remainingMiddleware[0]).bind(remainingMiddleware[0], ...args, bindMiddlewareFunction(selectMiddlewareFunction, remainingMiddleware.slice(1), ...args))
        : () => { };
}