/**
 * Acceptance test tool.
 * @packageDocumentation
 */

/// <reference types="node" />

/**
 * Creates an Action Step to be performed at runtime.
 * @public
 */
export declare function action(name: string, f: ActionFunction): void;

/**
 * Creates an Action Step to be performed at runtime.
 * @public
 */
export declare function action(nameParts: TemplateStringsArray, ...substitutions: any[]): (f?: ActionFunction) => void;

/**
 * Deprecated: Makes the enclosing `step()` an Action Step.
 * @public
 * @deprecated Use `action(name, f)` or `action` template tag instead.
 */
export declare function action(f: ActionFunction): void;

/**
 * @public
 */
export declare type ActionFunction = (state: Prescript.GlobalState, context: ITestExecutionContext) => void | Thenable;

/**
 * @alpha
 */
export declare type ActionWrapper = (step: IStep, execute: () => Promise<void>, state: Prescript.GlobalState, context: ITestExecutionContext) => Promise<void>;

/**
 * Deprecated.
 * @public
 * @deprecated Use `defer()` instead.
 */
export declare function cleanup<X>(name: StepDefName, f: () => X): X;

declare const _default: {
    test: typeof test_2;
    to: typeof to;
    action: typeof action;
    defer: typeof defer;
    pending: typeof pending_2;
    step: typeof step;
    cleanup: typeof cleanup;
    onFinish: typeof onFinish;
    getCurrentState: typeof getCurrentState;
    getCurrentContext: typeof getCurrentContext;
    getCurrentPrescriptionState: typeof getCurrentPrescriptionState;
    isPendingError: typeof isPendingError;
};
export default _default;

/**
 * Creates a Deferred Action Step, for, e.g., cleaning up resources.
 * @public
 */
export declare function defer(name: string, f: ActionFunction): void;

/**
 * Creates a Deferred Action Step, for, e.g., cleaning up resources.
 * @public
 */
export declare function defer(nameParts: TemplateStringsArray, ...substitutions: any[]): (f?: ActionFunction) => void;

/**
 * Returns the current action context object.
 * This allows library functions to hook into prescript’s current action context.
 * @public
 */
export declare function getCurrentContext(): ITestExecutionContext;

/**
 * Returns a state object that exists only during prescription phase for each test.
 * @public
 */
export declare function getCurrentPrescriptionState(): Prescript.PrescriptionState;

/**
 * Returns the current state object.
 * This allows library functions to hook into prescript’s state.
 * @public
 */
export declare function getCurrentState(): Prescript.GlobalState;

/**
 * Configuration defined in the `prescript.config.js` file.
 * For more information, see the {@link https://taskworld.github.io/prescript/guide/config.html | advanced configuration guide}.
 * @public
 */
export declare interface IConfig {
    /**
     * You can setup an action wrapper that will wrap all action steps. It is like a middleware.
     *
     * @remarks
     * It can be used for various purposes:
     * - Enhance the error message / stack trace.
     * - Benchmarking and profiling.
     * - etc.
     *
     * @alpha
     */
    wrapAction?: ActionWrapper;
    /**
     * Create a custom test reporter.
     * @remarks
     * It is very important that the reporter do not throw an error.
     * Otherwise, the behavior of prescript is undefined.
     * @param testModulePath - The path of the test file.
     * @alpha
     */
    createTestReporter?(testModulePath: string, testName: string): ITestReporter;
}

/**
 * Marks the steps inside as independent
 * @public
 */
export declare function independent<X>(f: () => X): X;

/**
 * Checks if the provided Error object is a PendingError, which is
 * thrown by the `pending()` step.
 *
 * @param e - The error to check.
 */
export declare function isPendingError(e: any): any;

/**
 * @alpha
 */
export declare interface IStep {
    name: StepName;
    number?: string;
    children?: IStep[];
    creator?: string;
    definition?: string;
    independent?: boolean;
    action?: ActionFunction;
    actionDefinition?: string;
    pending?: boolean;
    cleanup?: boolean;
    defer?: boolean;
}

/**
 * @public
 */
export declare interface ITestExecutionContext {
    /**
     * This adds a log message to the current step.
     * API is the same as `console.log()`.
     * Use this function instead of `console.log()` to not clutter the console output.
     * @param format - Format string, like `console.log()`
     * @param args - Arguments to be formatted.
     */
    log(format: any, ...args: any[]): void;
    /**
     * This adds an attachment to the current step, such as screenshot, JSON result, etc.
     * @param name - Name of the attachment
     * @param buffer - Attachment content
     * @param mimeType - MIME type of the attachment (image/jpeg, text/plain, application/json...)
     */
    attach(name: string, buffer: Buffer, mimeType: string): void;
}

/**
 * @alpha
 */
export declare interface ITestReporter {
    /**
     * Called when the test is finished.
     */
    onFinish(errors: Error[]): void;
    /**
     * Called when the test step is being entered.
     */
    onEnterStep(node: IStep): void;
    /**
     * Called when the test step is being exited.
     */
    onExitStep(node: IStep, error?: Error): void;
}

/**
 * Deprecated.
 * @public
 * @deprecated Use `defer()` instead.
 */
export declare function onFinish(f: () => void): void;

/**
 * Creates a Pending step to make the test end with pending state.
 * Useful for unfinished tests.
 * @public
 */
declare function pending_2(): void;
export { pending_2 as pending }

/**
 * Deprecated.
 * @public
 * @deprecated Use `to()` instead.
 */
export declare function step<X>(name: StepDefName, f: () => X): X;

/**
 * @public
 */
export declare type StepDefName = StepName | string;

/**
 * @public
 */
export declare class StepName {
    parts: string[];
    placeholders: string[];
    /**
     * @internal
     */
    constructor(parts: string[], placeholders: string[]);
    toString(): string;
}

/**
 * Creates a Test.
 * @public
 */
declare function test_2<X>(name: string, f: () => X): X;

/**
 * Creates a Test.
 * @public
 */
declare function test_2(nameParts: TemplateStringsArray, ...substitutions: any[]): <X>(f: () => X) => X;
export { test_2 as test }

/**
 * @public
 */
export declare interface Thenable {
    then(onFulfilled?: ((value: any) => any) | undefined | null, onRejected?: ((reason: any) => any) | undefined | null): Thenable;
}

/**
 * Creates a Compound Test Step, which can contain child steps.
 * @public
 */
export declare function to<X>(name: string, f: () => X): X;

/**
 * Creates a Compound Test Step, which can contain child steps.
 * @public
 */
export declare function to(nameParts: TemplateStringsArray, ...substitutions: any[]): <X>(f?: () => X) => X;

export { }
