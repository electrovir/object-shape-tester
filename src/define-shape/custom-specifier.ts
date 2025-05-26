import {check} from '@augment-vir/assert';
import {type Overwrite} from '@augment-vir/common';
import {type LiteralToPrimitive} from 'type-fest';
import {isShapeSpecifierKey} from './shape-keys.js';

/**
 * A key used to identify custom specifier instances.
 *
 * @category Internal
 */
export const customSpecifierKey =
    '__vir__custom__specifier__key__do__not__use__in__actual__objects';

/**
 * Checks if the given input is a custom specifier.
 *
 * @category Internal
 */
export function isCustomSpecifier(input: unknown): input is CustomSpecifier<unknown> {
    return check.hasKey(input, customSpecifierKey);
}

/**
 * A type representing a custom specifier.
 *
 * @category Internal
 */
export type CustomSpecifier<T> = {
    /** The name of this custom shape. This will be used in error messages. */
    customName: string;
    /** A function used to check if a value matches this custom shape. */
    checker: (value: unknown) => value is T;
    /** The default value for this custom shape. */
    defaultValue: T;
    [customSpecifierKey]: true;
    [isShapeSpecifierKey]: true;
};

/**
 * Use this to define a custom shape.
 *
 * @category Shape Part
 */
export function customShape<T>({
    customName,
    defaultValue,
    checker,
}: Overwrite<
    Omit<CustomSpecifier<T>, typeof customSpecifierKey | typeof isShapeSpecifierKey>,
    {checker: (value: unknown) => boolean}
>): CustomSpecifier<T> {
    return {
        customName,
        checker: checker as (value: unknown) => value is T,
        defaultValue,
        [customSpecifierKey]: true,
        [isShapeSpecifierKey]: true,
    };
}

/**
 * Extracts a custom specifier's type.
 *
 * @category Internal
 */
export type ExtractCustomSpecifierType<Specifier> =
    Specifier extends CustomSpecifier<infer T> ? T : LiteralToPrimitive<Specifier>;
