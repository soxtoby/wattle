import { spawn } from "child_process";
import { ITestInfo } from "./Test";
import { TestLogger } from "./TestLogger";

export class AppVeyorLogger extends TestLogger {
    testCompleted(test: ITestInfo): void {
        if (!test.children.length || test.error) {
            if (process.env.APPVEYOR_API_URL) {
                spawn('appveyor', [
                    'AddTest',
                    test.fullName.join(', '),
                    '-Framework', 'wattle',
                    '-FileName', test.module!,
                    '-Outcome', test.hasPassed ? 'Passed' : 'Failed',
                    '-Duration', test.duration.toFixed(0),
                    ...(test.hasPassed ? [] : ['-ErrorMessage', test.errorMessage!, '-ErrorStackTrace', test.errorStack!])
                ]);
            }
        }
    }
}