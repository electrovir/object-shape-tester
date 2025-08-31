import {Kind} from '@sinclair/typebox';
import {
    DefaultErrorFunction,
    type ErrorFunctionParameter,
    SetErrorFunction,
} from '@sinclair/typebox/errors';

const customErrorCallbacks: Record<string, ErrorMessageCallback> = {};

/**
 * Customer error message callback type.
 *
 * @category Internal
 */
export type ErrorMessageCallback = (this: void, error: Readonly<ErrorFunctionParameter>) => string;

/**
 * Register a custom error message for the given schema kind.
 *
 * @category Internal
 */
export function registerErrorMessage(kind: string, callback: ErrorMessageCallback): void {
    if (!(kind in customErrorCallbacks)) {
        customErrorCallbacks[kind] = callback;
    }
}

let errorMessageSet = false;

/**
 * Sets the custom error messages.
 *
 * @category Internal
 */
export function setShapeDefinitionErrorMessage() {
    if (errorMessageSet) {
        return;
    }
    errorMessageSet = true;
    SetErrorFunction((error) => {
        const errorCallback = customErrorCallbacks[error.schema[Kind]] || DefaultErrorFunction;
        return errorCallback(error);
    });
}
