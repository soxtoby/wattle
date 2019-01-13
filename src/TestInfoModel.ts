import { TestInfo } from "./Test";
import { TestEvent } from "./TestEvents";

export class TestInfoModel {
    readonly allTests: TestInfo[] = [];

    findTest(path: string[]) {
        return findTestRecursive(this.allTests, path);

        function findTestRecursive(tests: TestInfo[], path: string[]): TestInfo | undefined {
            let test = tests.find(t => t.name == path[0]);
            return test && path.length > 1
                ? findTestRecursive(test.children, path.slice(1))
                : test;
        }
    }

    moduleTests(module: string) {
        return this.allTests.filter(t => t.module == module);
    }

    get allTestsPassed() {
        return this.allTests.every(t => t.hasPassed);
    }

    update(event: TestEvent) {
        switch (event.type) {
            case 'TestCollected':
                let parent = this.findTest(event.path);
                (parent && parent.children || this.allTests).push(new TestInfo(event.name, parent, event.module));
                break;

            case 'TestRun':
                let test = this.findTest(event.path)!;
                test.runCount++;
                test.duration = event.duration;
                test.error = event.error;
                break;
        }
    }
}