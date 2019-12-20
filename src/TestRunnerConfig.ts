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

export let lastConfig: Partial<ITestRunnerConfig> = {};

export function configure(options: Partial<ITestRunnerConfig>) {
    lastConfig = options;
}

export function combineConfigs(...partialConfigs: Partial<ITestRunnerConfig>[]): Partial<ITestRunnerConfig> {
    let config = {} as any;

    for (let partial of partialConfigs)
        for (let [key, value] of Object.entries(partial))
            if (value != null)
                config[key] = value;

    return config;
}