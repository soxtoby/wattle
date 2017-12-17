import { spawn } from 'child_process';
import { writeFileSync } from 'fs';
import { ITestContext, TestMiddleware, ITestMiddleware } from "./Middleware";
import { Test, ITest } from "./Test";
import { UnitTest } from 'node-trx';
import appVeyorLogger from './AppVeyorLogger';
import teamCityLogger from './TeamCityLogger';
import tfsLogger from './TfsLogger';

export class BuildServerLogger implements ITestMiddleware {
    private innerLogger: ITestMiddleware;

    constructor() {
        this.innerLogger = process.env.APPVEYOR_API_URL ? appVeyorLogger
            : process.env.TEAMCITY_VERSION ? teamCityLogger
            : tfsLogger;
    }

    runModule(module: string, next: () => void): void {
        this.innerLogger.runModule(module, next);
    }

    collect(test: Test, next: () => void): void {
        this.innerLogger.collect(test, next);
    }

    run(test: Test, context: ITestContext, next: () => void): void {
        this.innerLogger.run(test, context, next);
    }

    finally(rootTests: ITest[], next: () => void): void {
        this.innerLogger.finally(rootTests, next);
    }
}
