import './setup';
import { describe, when, then, it, test } from '../lib/index';
import * as sinon from 'sinon';
import { expect } from 'chai';
import { Test } from '../lib/test';

describe("Test", () => {
    when("not run", () => {
        let sut = new Test("name", sinon.stub());

        then("run count is 0", () => expect(sut.runCount).to.equal(0));

        then("test has no error", () => expect(sut.error).to.be.undefined);

        then("test has not completed", () => expect(sut.hasCompleted).to.be.false);

        then("test has not passed", () => expect(sut.hasPassed).to.be.false);
    });

    when("run", () => {
        let testFn = sinon.stub();
        let sut = new Test("name", testFn);
        let context = {};

        when("test has no children", () => {
            when("test passes", () => {
                sut.run(context);

                then("run count increased", () => expect(sut.runCount).to.equal(1));

                then("test function called with context", () => expect(testFn).to.have.been.calledOn(context));

                then("test has completed", () => expect(sut.hasCompleted).to.be.true);

                then("test has passed", () => expect(sut.hasPassed).to.be.true);

                when("test run again", () => {
                    sut.run(context);

                    then("run count increased", () => expect(sut.runCount).to.equal(2));
                });
            });

            when("test throws", () => {
                testFn.throws();
                sut.run(context);

                then("run count increased", () => expect(sut.runCount).to.equal(1));

                then("test function called with context", () => expect(testFn).to.have.been.calledOn(context));

                then("test has completed", () => expect(sut.hasCompleted).to.be.true);

                then("test has not passed", () => expect(sut.hasPassed).to.be.false);
            });
        });

        when("test has children", () => {
            let child1Fn = sinon.stub();
            let child2Fn = sinon.stub();
            let child1 = new Test("child 1", child1Fn);
            let child2 = new Test("child 2", child2Fn);
            sut.children.push(child1, child2);

            when("test passes and one child has passed", () => {
                sut.run(context);
                child1.run(context);

                then("test has not completed", () => expect(sut.hasCompleted).to.be.false);

                then("test has not passed", () => expect(sut.hasPassed).to.be.false);
            });

            when("test has run and both children have passed", () => {
                sut.run(context);
                child1.run(context);
                sut.run(context);
                child2.run(context);

                then("test has completed", () => expect(sut.hasCompleted).to.be.true);

                then("test has passed", () => expect(sut.hasPassed).to.be.true);
            });

            when("test has run and one child has failed", () => {
                sut.run(context);
                child1.run(context);
                sut.run(context);
                child2Fn.throws();
                child2.run(context);

                then("test has completed", () => expect(sut.hasCompleted).to.be.true);

                then("test has not passed", () => expect(sut.hasPassed).to.be.false);
            });

            when("test throws", () => {
                testFn.throws();
                sut.run(context);

                then("test has completed", () => expect(sut.hasCompleted).to.be.true);

                then("test has not passed", () => expect(sut.hasPassed).to.be.false);
            });
        });

    });

    describe("depth", function () {
        let root = new Test("root", sinon.stub());
        let child = new Test("child", sinon.stub(), root);
        let grandchild = new Test("grandchild", sinon.stub(), child);

        it("starts at 0", () => expect(root.depth).to.equal(0));
        
        it("increases by 1 for each parent", () => {
            expect(child.depth).to.equal(1);
            expect(grandchild.depth).to.equal(2);
        });
    });
});