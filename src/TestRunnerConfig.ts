import * as os from 'os';
import { LogLevel } from "./LogLevel";

export interface ITestRunnerConfig {
    testFiles: string[];
    middleware: string[];
    showStacks: boolean;
    verbosity: LogLevel;
    buildServer: boolean;
    processCount: number;
    watch: boolean;
    tsProject: string;
}

export const defaults: ITestRunnerConfig = {
    testFiles: ['**/*.@(ts|tsx|js|jsx)', '!node_modules/**'],
    middleware: [],
    showStacks: false,
    verbosity: LogLevel.default,
    buildServer: false,
    processCount: os.cpus().length,
    watch: false,
    tsProject: 'tsconfig.json'
};