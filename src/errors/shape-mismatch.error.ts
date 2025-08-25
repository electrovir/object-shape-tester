import {check} from '@augment-vir/assert';
import {indent, stringify} from '@augment-vir/common';
import {type ValueError} from '@sinclair/typebox/errors';

/**
 * This error is thrown when a shape assertion fails.
 *
 * @category Util
 */
export class ShapeMismatchError extends TypeError {
    public override name = 'ShapeMismatchError';
    constructor(
        public readonly value: unknown,
        public readonly errors: ReadonlyArray<Readonly<ValueError>>,
    ) {
        const errorMessages: string = errors.map((error) => createErrorMessage(error)).join('\n');

        const message = `Shape mismatch:\n    Got ${stringify(value)}.\n\n${indent(errorMessages, 1)}`;

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
