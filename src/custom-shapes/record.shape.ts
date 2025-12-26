import {check} from '@augment-vir/assert';
import {type AnyObject, type AtLeastTuple, filterMap, removeDuplicates} from '@augment-vir/common';
import {
    Kind,
    type SchemaOptions,
    type TConst,
    type TLiteral,
    type TSchema,
    type TUnion,
    Type,
    TypeRegistry,
} from '@sinclair/typebox';
import {type IsEqual} from 'type-fest';
import {registerErrorMessage} from '../errors/error-message.js';
import {checkValidShape} from '../shape/check-shape.js';
import {defineShape, isSchema, isShape, type Shape, type ShapeInitType} from '../shape/shape.js';
import {enumShape} from './enum.shape.js';
import {exactShape} from './exact.shape.js';
import {unionShape} from './union.shape.js';

/**
 * Kind for {@link recordShape}.
 *
 * @category Internal
 */
export const recordShapeKind = 'recordShape' as const;

type RecordShapeOptions = {
    [Kind]: typeof recordShapeKind;
    keysShape: Shape;
    valuesShape: Shape;
    isPartial: boolean;
    additionalProperties: boolean;
};

/**
 * Creates a shape that requires an object with certain keys and values.
 *
 * @category Shape
 * @example
 *
 * ```ts
 * import {recordShape, checkValidShape} from 'object-shape-tester';
 *
 * const myShape = recordShape({
 *     keys: '',
 *     values: -1,
 * });
 *
 * checkValidShape({a: 0}, myShape); // `true`
 * checkValidShape({a: '0'}, myShape); // `false`
 * ```
 */
export function recordShape<K, V, IsPartial extends boolean>({
    keys,
    values,
    partial,
    additionalProperties,
}: {
    keys: K;
    values: V;
    /**
     * If set to `true`, all keys are optional.
     *
     * @default false
     */
    partial?: IsPartial;
    /**
     * Set to `true` to allow additional properties in addition to the required properties.
     *
     * @default false
     */
    additionalProperties?: boolean;
}) {
    setRecordShapeRegistry();

    const keysShape = defineKeysShape(keys);
    const valuesShape = defineShape(values);

    return defineShape(
        Type.Unsafe<
            IsEqual<IsPartial, true> extends true
                ? Partial<Record<Extract<ShapeInitType<K>, PropertyKey>, ShapeInitType<V>>>
                : Record<Extract<ShapeInitType<K>, PropertyKey>, ShapeInitType<V>>
        >({
            [Kind]: recordShapeKind,
            keysShape,
            valuesShape,
            isPartial: !!partial,
            additionalProperties: !!additionalProperties,
            default: createDefaultValue({
                isPartial: !!partial,
                keysShape,
                valuesShape,
            }),
        } satisfies RecordShapeOptions & SchemaOptions),
    );
}

function setRecordShapeRegistry() {
    /* node:coverage disable: this package transitively depends on itself so this gets executed outside of the coverage calculator. */
    if (!TypeRegistry.Has(recordShapeKind)) {
        TypeRegistry.Set(recordShapeKind, (options: RecordShapeOptions, value) => {
            if (typeof value !== 'object' || !value || Array.isArray(value)) {
                return false;
            }

            const existingKeysMatch = Object.entries(value).every(
                ([
                    key,
                    value,
                ]) => {
                    const matchesKey = options.additionalProperties
                        ? true
                        : checkValidShape(key, options.keysShape);
                    const matchesValue = checkValidShape(value, options.valuesShape);

                    return matchesKey && matchesValue;
                },
            );

            const hasAllKeys = options.isPartial
                ? true
                : !getMissingKeys(options.keysShape, value).length;

            return existingKeysMatch && hasAllKeys;
        });
    }
    /* node:coverage enable */

    registerErrorMessage(recordShapeKind, (error) => {
        const schema = error.schema;
        const options = schema as SchemaOptions as RecordShapeOptions & SchemaOptions;

        const value = error.value;

        if (typeof value !== 'object' || !value || Array.isArray(value)) {
            return 'Expected an object';
        }

        const wrongExistingKeys = filterMap(
            Object.entries(value),
            ([key]) => key,
            (
                mappedKey,
                [
                    key,
                    value,
                ],
            ) => {
                return (
                    !checkValidShape(key, options.keysShape) ||
                    !checkValidShape(value, options.valuesShape)
                );
            },
        );

        const missingKeys = getMissingKeys(options.keysShape, value);

        const wrongKeysString = wrongExistingKeys.length
            ? [
                  'Failure at keys',
                  wrongExistingKeys.join(','),
              ].join(': ')
            : '';
        const missingKeysString = missingKeys.length
            ? [
                  'Missing keys',
                  missingKeys.join(','),
              ].join(': ')
            : '';

        return [
            wrongKeysString,
            missingKeysString,
        ]
            .filter(check.isTruthy)
            .join('\n');
    });
}

function getMissingKeys(keysShape: Shape, input: object): PropertyKey[] {
    const finiteKeys = extractFiniteKeys(keysShape).filter((entry) => check.isPropertyKey(entry));

    if (!finiteKeys.length) {
        return [];
    }

    return finiteKeys.filter((key) => !check.hasKey(input, key));
}

function createDefaultValue({
    keysShape,
    valuesShape,
    isPartial,
}: {
    keysShape: Shape;
    valuesShape: Shape;
    isPartial: boolean;
}): Record<any, any> {
    if (isPartial) {
        return {};
    } else {
        const finiteKeys = extractFiniteKeys(keysShape);
        const defaultValue = valuesShape.default;
        return Object.fromEntries(
            finiteKeys.map((key) => [
                key,
                defaultValue,
            ]),
        );
    }
}

/**
 * Converts a keys requirement to a {@link Shape}.
 *
 * @category Internal
 */
export function defineKeysShape(keys: unknown): Shape {
    if (isShape(keys)) {
        return keys;
    } else if (isSchema(keys)) {
        return defineShape(keys);
    } else if (check.isObject(keys)) {
        return enumShape(keys as AnyObject);
    } else if (check.isArray(keys) && check.isLengthAtLeast(keys, 1)) {
        return unionShape(
            ...(keys.map((key) => exactShape(key)) as unknown as AtLeastTuple<any, 1>),
        );
    } else if (check.isPropertyKey(keys)) {
        return defineShape(keys);
    } else {
        return defineShape(Type.Undefined());
    }
}

/**
 * Extracts all finite keys, if any, that match the given keys {@link Shape}.
 *
 * @category Internal
 */
export function extractFiniteKeys(keys: Shape): unknown[] {
    const schema: TSchema = keys.$_schema;
    const kind = schema[Kind].toLowerCase();

    if (
        [
            'const',
            'literal',
        ].includes(kind)
    ) {
        return [
            (schema as AnyObject as TConst<unknown> | TLiteral).const,
        ];
    } else if (kind === 'union') {
        return removeDuplicates(
            (schema as TUnion).anyOf.flatMap((subSchema) =>
                extractFiniteKeys(defineShape(subSchema)),
            ),
        );
    } else if (
        [
            'undefined',
            'number',
            'string',
            'symbol',
        ].includes(kind)
    ) {
        /** Not a finite set of keys. */
        return [];
    } else {
        return extractFiniteKeys(defineKeysShape(keys.default));
    }
}
