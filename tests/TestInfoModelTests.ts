import { expect } from "chai";
import { describe, it, then, when } from "../lib";
import { TestInfoModel } from "../src/TestInfoModel";
import './setup';

describe("TestInfoModel", function () {
    let sut = new TestInfoModel();

    when("module started", () => {
        let testModule = 'some module';
        sut.update({ type: 'ModuleStarted', module: testModule });

        when("test collected", () => {
            let testName = 'some test';
            sut.update({ type: 'TestCollected', module: testModule, path: [], name: testName });

            it("is added to tests", () => {
                let result = sut.findTest(testModule, [testName]);

                expect(result).to.exist;
                expect(result.module).to.equal(testModule);
                expect(result.name).to.equal(testName);

                expect(sut.allTests).to.have.members([result]);
                expect(sut.moduleTests(testModule)).to.have.members([result]);
            });

            when("child test collected", () => {
                let childName = 'child test';
                sut.update({ type: 'TestCollected', module: testModule, path: [testName], name: childName });

                it("is added underneath parent", () => {
                    let parent = sut.findTest(testModule, [testName]);
                    let child = sut.findTest(testModule, [testName, childName]);

                    expect(child).to.exist;
                    expect(child.parent).to.equal(parent);
                    expect(child.module).to.equal(testModule);
                    expect(child.name).to.equal(childName);

                    expect(parent.children).to.have.members([child]);
                });
            });

            when("test has been run successfully", () => {
                sut.update({ type: 'TestRun', module: testModule, path: [testName], duration: 2 });

                then("test is updated", () => {
                    let test = sut.findTest(testModule, [testName]);

                    expect(test.runCount).to.equal(1);
                    expect(test.duration).to.equal(2);
                });

                then("all tests have passed", () => expect(sut.allTestsPassed).to.be.true);

                when("test is run again", () => {
                    sut.update({ type: 'TestRun', module: testModule, path: [testName], duration: 3 });

                    then("run count incremented", () => expect(sut.findTest(testModule, [testName]).runCount).to.equal(2));

                    then("duration is set", () => expect(sut.findTest(testModule, [testName]).duration).to.equal(3));
                });
            });

            when("test has failed", () => {
                let error = { message: 'error', stack: 'stack' };
                sut.update({ type: 'TestRun', module: testModule, path: [testName], duration: 2, error });

                then("test is updated with error", () => expect(sut.findTest(testModule, [testName]).error).to.equal(error));

                then("not all tests have passed", () => expect(sut.allTestsPassed).to.be.false);
            });
        });
    });
});