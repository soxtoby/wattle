import * as console from 'console';
import * as glob from 'fast-glob';
import * as path from 'path';
import { register } from 'ts-node';
import { AppVeyorLogger } from './AppVeyorLogger';
import { ConsoleLogger } from "./ConsoleLogger";
import { LogLevel } from "./LogLevel";
import { isMiddleware, ITestMiddleware } from "./Middleware";
import { TeamCityLogger } from './TeamCityLogger';
import { ITestLogger } from './TestLogger';
import { TfsLogger } from './TfsLogger';

export function registerTypeScript(tsProject?: string) {
    register(tsProject ? { project: tsProject } : undefined);
}

export function resolveTestFiles(explicitTestFiles: string[], implicitTestFiles: string[]) {
    let fileGlobs = explicitTestFiles
        || implicitTestFiles.length && implicitTestFiles
        || ['**/*.@(ts|tsx|js|jsx)', '!node_modules/**'];
    fileGlobs.push('!**/*.d.ts'); // No one wants to test .d.ts files

    return glob.sync(fileGlobs, { onlyFiles: true, absolute: true }) as string[];
}

export const ErrorLoadingMiddleware = 2;

export function loadMiddleware(middlewareModules: string[]): ITestMiddleware[] {
    return middlewareModules
        .map(m => {
            try {
                var module = require(path.resolve(m));
            } catch (e) {
                console.error(`Failed to load middleware module ${m}\n${e.stack}`);
                process.exit(ErrorLoadingMiddleware);
            }
            let middleware = module.default;
            if (!isMiddleware(middleware)) {
                console.error(`Invalid middleware: ${m}.\nMiddleware modules must export a middleware object as their default export.`);
                process.exit(ErrorLoadingMiddleware);
            }
            return middleware;
        });
}

export function getLogger(buildServer: boolean, logLevel: LogLevel, showStacks: boolean, testFiles: string[]): ITestLogger {
    if (buildServer) {
        return process.env.APPVEYOR_API_URL ? new AppVeyorLogger()
            : process.env.TEAMCITY_VERSION ? new TeamCityLogger()
                : new TfsLogger();
    }
    return new ConsoleLogger(logLevel, showStacks, testFiles);
}