export enum ExitCodes {
    Success = 0,
    TestsFailed,
    UnexpectedError,
    ErrorLoadingMiddleware,
    ExceededMemoryLimit,
    NoTests
}