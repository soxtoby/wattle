import './setup';
import { describe, when, it, then } from "../lib/index";
import * as sinon from "sinon";
import { expect } from "chai";
import { TestMiddleware, ITestMiddleware, bindMiddlewareFunction, ITestContext } from "../lib/middleware";
import { Test } from "../lib/test";
import { SinonStub } from 'sinon';

describe("middleware", function () {
    describe("TestMiddleware base class", function () {
        let test = new Test("name", sinon.stub());
        let next = sinon.stub();
        let sut = new (class TestableMiddleware extends TestMiddleware { })();

        when("collecting", () => {
            sut.collect(test, next);

            it("passes to next layer", () => expect(next).to.be.called);
        });

        when("running", () => {
            sut.run(test, {}, next);

            it("passes to next layer", () => expect(next).to.be.called);
        });
    });

    describe("binding", function () {
        let middleware1: ITestMiddleware = { collect: sinon.stub(), run: sinon.stub() };
        let middleware2: ITestMiddleware = { collect: sinon.stub(), run: sinon.stub() };

        let test = new Test("name", sinon.stub());
        let context = {};

        when("run", () => {
            run([middleware1], test, context);

            it("passes args to middleware function", () => expect(middleware1.run).to.be.calledWith(test, context));
        });

        when("first middleware passes to next", () => {
            middleware1.run = (t, c, next) => next();
            run([middleware1, middleware2], test, context);

            then("second middleware called with same args", () => expect(middleware2.run).to.be.calledWith(test, context));
        });

        when("first middleware doesn't pass to next", () => {
            run([middleware1, middleware2], test, context);

            then("second middleware not called", () => expect(middleware2.collect).to.not.be.called);
        });

        when("last layer of middleware passes to next", () => {
            middleware1.collect = (t, next) => next();

            it("runs without error", () => run([middleware1], test, context));
        });

        function run(middleware: ITestMiddleware[], test: Test, context: ITestContext) {
            let boundFn = bindMiddlewareFunction(m => m.run, middleware, test, context);
            boundFn();
        }
    });
});