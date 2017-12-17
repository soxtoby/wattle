/// <reference path="./mock-promises.d.ts" />
import './setup';
import { describe, when, then, it, ITestContext } from '../lib/index';
import * as sinon from 'sinon';
import { SinonStub, SinonSpy } from 'sinon';
import { expect } from 'chai';
import { ITestMiddleware } from '../src/Middleware';
import { Test } from '../src/test';
import { TestRunner } from '../src/TestRunner';
import * as mockPromises from 'mock-promises';
import { TestMiddleware } from '../lib/Middleware';

describe("running individual tests", () => {
    let sut = new TestRunner();

    when("running empty test method", () => {
        let testFunction = sinon.stub();
        let result = sut.test("TestName", testFunction)!;

        then("test is completed", () => expect(result.hasCompleted).to.be.true);
        then("test run once", () => expect(result.runCount).to.equal(1));
        then("test run with test context", () => expect(testFunction).to.not.have.been.calledOn(undefined));

        when("running another empty test method", () => {
            let testFunction2 = sinon.stub();
            let result2 = sut.test("AnotherTestName", () => { })!;

            then("second test is completed", () => expect(result2.hasCompleted).to.be.true);
            then("second test run once", () => expect(result2.runCount).to.equal(1));
            then("second test run with a different test context", () => expect(testFunction2).to.not.have.been.calledOn(testFunction.firstCall.thisValue));
            then("root tests contain both tests", () => expect(sut.rootTests).to.have.members([result, result2]));
        });
    });

    when("running a test method with an inner test method call", () => {
        let innerResult: Test;
        let innerTestFunction = sinon.stub();
        let testFunction = () => {
            innerResult = sut.test("Inner Test", innerTestFunction)!;
        };
        testFunction = sinon.spy(testFunction);
        let result = sut.test("Outer Test", testFunction)!;

        then("outer test is completed", () => expect(result.hasCompleted).to.be.true);
        then("outer test run once", () => expect(result.runCount).to.equal(1));
        then("outer test has inner test as child", () => expect(result.children).to.deep.equal([innerResult]));

        then("inner function gets same test context as outer", () =>
            expect(innerTestFunction).to.have.been.calledOn((testFunction as SinonStub).firstCall.thisValue));

        then("root tests contain just the outer test", () => expect(sut.rootTests).to.have.members([result]));
    });

    when("running a test method with 2 inner test method calls", () => {
        let innerResult: Test, innerResult2: Test;
        let innerFunction1 = sinon.stub();
        let innerFunction2 = sinon.stub();
        let testFunction = () => {
            innerResult = sut.test("Inner Test", innerFunction1)!;
            innerResult2 = sut.test("Inner Test 2", innerFunction2)!;
        };
        testFunction = sinon.spy(testFunction);
        let testSpy = testFunction as SinonSpy;
        let result = sut.test("Outer Test", testFunction)!;

        then("outer test is completed", () => expect(result.hasCompleted).to.be.true);
        then("outer test run twice", () => expect(result.runCount).to.equal(2));
        then("outer test has inner tests as children", () => expect(result.children).to.deep.equal([innerResult, innerResult2]));

        then("each outer call has different test context", () =>
            expect(testSpy.firstCall.thisValue).to.not.equal(testSpy.secondCall.thisValue));

        then("inner function 1 gets same test context as first outer call", () =>
            expect(innerFunction1).to.have.been.calledOn(testSpy.firstCall.thisValue));

        then("inner function 2 gets same test context as second outer call", () =>
            expect(innerFunction2).to.have.been.calledOn(testSpy.secondCall.thisValue));
    });

    when("running a test method with 3 inner test method calls", () => {
        let innerResult: Test, innerResult2: Test, innerResult3: Test;
        let result = sut.test("Outer Test", () => {
            innerResult = sut.test("Inner Test", () => { })!;
            innerResult2 = sut.test("Inner Test 2", () => { })!;
            innerResult3 = sut.test("Inner Test 3", () => { })!;
        })!;

        then("outer test is completed", () => expect(result.hasCompleted).to.be.true);
        then("outer test run three times", () => expect(result.runCount).to.equal(3));
        then("outer test has inner tests as children", () => expect(result.children).to.deep.equal([innerResult, innerResult2, innerResult3]));
    });

    when("running a test method with a double nested test method call", () => {
        let innerResult: Test, innerInnerResult: Test, innerInnerResult2: Test;
        let result = sut.test("Outer Test", () => {
            innerResult = sut.test("Inner Test", () => {
                innerInnerResult = sut.test("Inner Inner Test", () => { })!;
                innerInnerResult2 = sut.test("Inner Inner Test 2", () => { })!;
            })!;
        })!;

        then("outer test is completed", () => expect(result.hasCompleted).to.be.true);
        then("outer test run twice", () => expect(result.runCount).to.equal(2));
        then("outer test has inner test as child", () => expect(result.children).to.deep.equal([innerResult]));
        then("inner test has innermost tests as children", () => expect(innerResult.children).to.deep.equal([innerInnerResult, innerInnerResult2]));
    });
});

describe("running tests in test files", function () {
    Promise = mockPromises.getMockPromise(Promise);

    class Spy extends TestMiddleware {
        collectedTests: Test[] = [];
        collectedTestNames: string[] = [];
        runTests: string[] = [];

        collect(test: Test, next: () => void) {
            this.collectedTests.push(test);
            this.collectedTestNames.push(test.name);
            next();
        }

        run(test: Test, context: ITestContext, next: () => void) {
            this.runTests.push(test.name);
            next();
        }
    }

    let spy = new Spy();
    let sut = new TestRunner([spy]);

    when("test files are run", () => {
        let testFiles = ['../tests/test-files/file1.ts', '../tests/test-files/file2.ts'];
        testFiles.forEach(f => delete require.cache[require.resolve(f)]);
        sut.runTests(testFiles);
        mockPromises.tickAllTheWay();

        then("files are loaded before tests are run", () => expect(spy.collectedTestNames).to.have.members(['file1', 'file2', 'file1 test', 'file2 test']));

        then("all tests are run", () => expect(spy.runTests).to.have.members([
            'file1', 'file1 test',
            'file2', 'file2 test'
        ]));
    });

    Promise = mockPromises.getOriginalPromise(Promise);
});