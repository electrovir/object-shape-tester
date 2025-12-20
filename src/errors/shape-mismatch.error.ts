import {check} from '@augment-vir/assert';
import {combineErrorMessages, indent} from '@augment-vir/common';
import {type ValueError} from '@sinclair/typebox/errors';

/**
 * This error is thrown when a shape assertion fails.
 *
 * @category Internal
 */
export class ShapeMismatchError extends TypeError {
    public override name = 'ShapeMismatchError';
    constructor(
        public readonly errors: ReadonlyArray<Readonly<ValueError>>,
        public readonly failureMessage?: string | undefined,
    ) {
        const errorMessages: string = errors.map((error) => createErrorMessage(error)).join('\n');

        const message = combineErrorMessages(
            failureMessage,
            `Shape mismatch:\n${indent(errorMessages, 1)}`,
        );

        super(message);
    }
}

function getSubErrors(error: Readonly<ValueError>): ReadonlyArray<Readonly<ValueError>> {
    return error.errors.flatMap((nestedErrors) => Array.from(nestedErrors));
}

function createErrorMessage(error: Readonly<ValueError>, indentCount = 0): string {
    const subErrorMessages = getSubErrors(error).map((subError) =>
        createErrorMessage(subError, indentCount + 1),
    );

    const currentMessage =
        [
            error.path,
            error.message,
        ]
            .filter(check.isTruthy)
            .join(': ') + (subErrorMessages.length ? ':' : '');

    return [
        indent(currentMessage, indentCount),
        ...subErrorMessages,
    ].join('\n');
}
