import * as console from 'console';
import { register } from 'ts-node';
import { ExitCodes } from "./ExitCodes";
import { isMiddleware, ITestMiddleware } from "./Middleware";
import { requirePath } from "./Path";

let isTypeScriptRegistered = false;
export function registerTypeScript(tsProject?: string) {
    if (!isTypeScriptRegistered) {
        register(tsProject ? { project: tsProject } : undefined);
        isTypeScriptRegistered = true;
    }
}

export function loadMiddleware(middlewareModules: string[]): ITestMiddleware[] {
    return middlewareModules
        .map(m => {
            try {
                var module = requirePath(m);
            } catch (e: any) {
                console.error(`Failed to load middleware module ${m}\n${e.stack}`);
                process.exit(ExitCodes.ErrorLoadingMiddleware);
            }
            let middleware = module.default;
            if (!isMiddleware(middleware)) {
                console.error(`Invalid middleware: ${m}.\nMiddleware modules must export a middleware object as their default export.`);
                process.exit(ExitCodes.ErrorLoadingMiddleware);
            }
            return middleware;
        });
}

export function fixWindowsPath(path: string) {
    return path.replace(/\\/g, '/');
}