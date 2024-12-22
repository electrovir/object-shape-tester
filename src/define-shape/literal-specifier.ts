import {check} from '@augment-vir/assert';
import {LiteralToPrimitive} from 'type-fest';

/**
 * A key used to identify literal specifier instances.
 *
 * @category Internal
 */
export const literalSpecifierKey =
    '__vir__literal__specifier__key__do__not__use__in__actual__objects';

/**
 * Checks if the given input is a literal specifier.
 *
 * @category Internal
 */
export function isLiteralSpecifier(input: unknown): input is LiteralSpecifier<unknown> {
    return check.hasKey(input, literalSpecifierKey);
}

/**
 * A type representing a literal specifier.
 *
 * @category Internal
 */
export type LiteralSpecifier<T> = {
    /** A function used to check if a value matches the given literal. */
    checker: (value: unknown) => value is T;
    /** Default value for this literal specifier. */
    defaultValue: T;
    [literalSpecifierKey]: true;
};

/**
 * Use this to define a literal specifier.
 *
 * @category Shape Part
 */
export function literal<T>(
    /** Default value for this literal specifier. */
    defaultValue: T,
    /** A function used to check if a value matches the given literal. */
    checker: (value: unknown) => value is T,
): LiteralSpecifier<T> {
    return {
        checker,
        defaultValue,
        [literalSpecifierKey]: true,
    };
}

/**
 * Extracts the literal type from a literal specifier.
 *
 * @category Internal
 */
export type ExtractLiteralSpecifierType<Specifier> =
    Specifier extends LiteralSpecifier<infer T> ? T : LiteralToPrimitive<Specifier>;
