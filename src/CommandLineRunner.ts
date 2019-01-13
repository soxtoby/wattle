import { args } from './CommandLineArgs';
import { runTests as runTestsMulti } from './MultiProcessRunner';
import { runTests as runTestsSingle } from './SingleProcessRunner';

if (args.processCount == 0)
    runTestsSingle();
else
    runTestsMulti();
