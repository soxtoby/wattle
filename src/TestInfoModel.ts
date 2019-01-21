import { TestInfo } from "./Test";
import { TestEvent } from "./TestEvents";

export class TestInfoModel {
    readonly modules: { [module: string]: TestInfo[] } = {};

    get allTests() { return Object.entries(this.modules).reduce((all, [, ts]) => all.concat(ts), [] as TestInfo[]); }

    findTest(module: string, path: string[]) {
        return findTestRecursive(this.moduleTests(module), path);

        function findTestRecursive(tests: TestInfo[], path: string[]): TestInfo | undefined {
            let test = tests.find(t => t.name == path[0]);
            return test && path.length > 1
                ? findTestRecursive(test.children, path.slice(1))
                : test;
        }
    }

    moduleTests(module: string) {
        return this.modules[module] || [];
    }

    get allTestsPassed() {
        return this.allTests.every(t => t.hasPassed);
    }

    update(event: TestEvent) {
        switch (event.type) {
            case 'ModuleStarted':
                this.modules[event.module] = [];
                break;

            case 'TestCollected':
                let parent = this.findTest(event.module, event.path);
                let siblings = (parent && parent.children || this.modules[event.module]);
                siblings.push(new TestInfo(event.name, parent, event.module));
                break;

            case 'TestRun':
                let test = this.findTest(event.module, event.path)!;
                test.runCount++;
                test.duration = event.duration;
                test.error = event.error;
                break;
        }
    }
}