import * as console from 'console';
import * as path from 'path';
import { register } from 'ts-node';
import { AppVeyorLogger } from './AppVeyorLogger';
import { ConsoleLogger } from "./ConsoleLogger";
import { ExitCodes } from "./ExitCodes";
import { LogLevel } from "./LogLevel";
import { isMiddleware, ITestMiddleware } from "./Middleware";
import { TeamCityLogger } from './TeamCityLogger';
import { ITestLogger } from './TestLogger';
import { TfsLogger } from './TfsLogger';

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
                var module = require(path.resolve(m));
            } catch (e) {
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