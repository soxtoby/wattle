import { expect } from "chai";
import { describe, it, then, when } from "../lib";
import { TestInfoModel } from "../src/TestInfoModel";
import './setup';

describe("TestInfoModel", function () {
    let sut = new TestInfoModel();

    when("test collected", () => {
        let testName = 'some test';
        let testModule = 'some module';
        sut.update({ type: 'TestCollected', path: [], name: testName, module: testModule });

        it("is added to tests", () => {
            let result = sut.findTest([testName]);

            expect(result).to.exist;
            expect(result.module).to.equal(testModule);
            expect(result.name).to.equal(testName);

            expect(sut.allTests).to.have.members([result]);
            expect(sut.moduleTests(testModule)).to.have.members([result]);
        });

        when("child test collected", () => {
            let childName = 'child test';
            sut.update({ type: 'TestCollected', path: [testName], name: childName });

            it("is added underneath parent", () => {
                let parent = sut.findTest([testName]);
                let child = sut.findTest([testName, childName]);

                expect(child).to.exist;
                expect(child.parent).to.equal(parent);
                expect(child.module).to.equal(testModule);
                expect(child.name).to.equal(childName);

                expect(parent.children).to.have.members([child]);
            });
        });

        when("test has been run successfully", () => {
            sut.update({ type: 'TestRun', path: [testName], duration: 2 });

            then("test is updated", () => {
                let test = sut.findTest([testName]);

                expect(test.runCount).to.equal(1);
                expect(test.duration).to.equal(2);
            });

            then("all tests have passed", () => expect(sut.allTestsPassed).to.be.true);

            when("test is run again", () => {
                sut.update({ type: 'TestRun', path: [testName], duration: 3 });

                then("run count incremented", () => expect(sut.findTest([testName]).runCount).to.equal(2));

                then("duration is set", () => expect(sut.findTest([testName]).duration).to.equal(3));
            });
        });

        when("test has failed", () => {
            let error = { message: 'error', stack: 'stack' };
            sut.update({ type: 'TestRun', path: [testName], duration: 2, error });

            then("test is updated with error", () => expect(sut.findTest([testName]).error).to.equal(error));

            then("not all tests have passed", () => expect(sut.allTestsPassed).to.be.false);
        });
    });
});