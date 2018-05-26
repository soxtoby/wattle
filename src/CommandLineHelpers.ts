import * as console from 'console';
import * as glob from 'glob';
import * as path from 'path';
import { BuildServerLogger } from "./BuildServerLogger";
import { ConsoleLogger } from "./ConsoleLogger";
import { LogLevel } from "./LogLevel";
import { ITestMiddleware, isMiddleware } from "./Middleware";

export function resolveTestFiles(explicitTestFiles: string[], implicitTestFiles: string[]) {
    let fileGlobs = explicitTestFiles
        || implicitTestFiles.length && implicitTestFiles
        || ['**/*.@(ts|tsx|js|jsx)', '!node_modules/**'];
    fileGlobs.push('!./**/*.d.ts'); // No one wants to test .d.ts files

    let testGlobs = fileGlobs.filter(g => g[0] != '!');
    let ignoreGlobs = fileGlobs.filter(g => g[0] == '!').map(g => g.substring(1));

    return testGlobs
        .map(g => glob.sync(g, { nodir: true, ignore: ignoreGlobs }))
        .reduce((r, fs) => r.concat(fs), [])
        .map(f => path.resolve(f));
}

export function loadMiddleware(middlewareModules: string[]): ITestMiddleware[] {
    return middlewareModules
        .map(m => {
            try {
                var module = require(path.resolve(m));
            } catch (e) {
                console.error(`Failed to load middleware module ${m}\n${e.message}`);
                process.exit(1);
            }
            let middleware = module.default;
            if (!isMiddleware(middleware)) {
                console.error(`Invalid middleware: ${m}.\nMiddleware modules must export a middleware object as their default export.`);
                process.exit(1);
            }
            return middleware;
        });
}

export function getLogger(buildServer: boolean, logLevel: LogLevel, showStacks: boolean, testFiles: string[]) {
    return buildServer
        ? new BuildServerLogger()
        : new ConsoleLogger(logLevel, showStacks, testFiles);
}