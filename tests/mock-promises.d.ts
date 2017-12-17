declare module 'mock-promises' {
    interface IMockPromises {
        getMockPromise(promiseType: typeof Promise) : typeof Promise;
        getOriginalPromise(promistType: typeof Promise): typeof Promise;
        tickAllTheWay(): void;
    }
    const mockPromises: IMockPromises;
    export = mockPromises;
}