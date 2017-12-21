import { TestMiddleware, ITestContext } from "./Middleware";
import { ITest } from "./Test";
import { spawn } from "child_process";

export class AppVeyorLogger extends TestMiddleware {
    run(test: ITest, context: ITestContext, next: () => void): void {
        next();

        if (!test.children.length) {
            if (process.env.APPVEYOR_API_URL) {
                spawn('appveyor', [
                    'AddTest',
                    test.fullName.join(', '),
                    '-Framework', 'wattle',
                    '-FileName', test.module!,
                    '-Outcome', test.hasPassed ? 'Passed' : 'Failed',
                    '-Duration', test.duration.toFixed(0),
                    ...(test.hasPassed ? [] : ['-ErrorMessage', test.error.toString(), '-ErrorStackTrace', test.error.stack])
                ]);
            }
        }
    }
}

export default new AppVeyorLogger();