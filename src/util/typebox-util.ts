import {
    Kind,
    OptionalKind,
    type TNull,
    type TObject,
    type TOptional,
    type TSchema,
    type TUndefined,
    type TUnion,
    Type,
} from '@sinclair/typebox';

/**
 * Checks if a schema is an object schema.
 *
 * @category Internal
 */
export function isObjectSchema(schema: TSchema): schema is TObject {
    return schema[Kind] === ('Object' satisfies TObject[typeof Kind]);
}

/**
 * Checks if a schema is a union schema.
 *
 * @category Internal
 */
export function isUnionSchema(schema: TSchema): schema is TUnion {
    return schema[Kind] === ('Union' satisfies TUnion[typeof Kind]);
}

/**
 * Checks if a schema is an optional schema.
 *
 * @category Internal
 */
export function isOptionalSchema(schema: TSchema): schema is TOptional<TSchema> {
    return schema[OptionalKind] === ('Optional' satisfies TOptional<TSchema>[typeof OptionalKind]);
}

/**
 * Checks if a schema is a null schema.
 *
 * @category Internal
 */
export function isNullSchema(schema: TSchema): schema is TNull {
    return schema[Kind] === ('Null' satisfies TNull[typeof Kind]);
}

/**
 * Checks if a schema is an undefined schema.
 *
 * @category Internal
 */
export function isUndefinedSchema(schema: TSchema): schema is TUndefined {
    return schema[Kind] === ('Undefined' satisfies TUndefined[typeof Kind]);
}

/**
 * Checks if a schema guard matches the schema or a part of the schema's union.
 *
 * @category Internal
 */
export function matchesSchemaGuard<T extends TSchema>(
    schema: TSchema,
    guard: (schema: TSchema) => schema is T,
): schema is T {
    if (guard(schema)) {
        return true;
    } else if (isUnionSchema(schema)) {
        return schema.anyOf.some((entry) => matchesSchemaGuard(entry, guard));
    } else {
        return false;
    }
}

/**
 * Checks if a schema can be nullable (optional, `undefined`, or `null`).
 *
 * @category Internal
 */
export function canSchemaBeNullable(schema: TSchema): boolean {
    return [
        isNullSchema,
        isUndefinedSchema,
        isOptionalSchema,
    ].some((guard) => matchesSchemaGuard(schema, guard as (schema: TSchema) => schema is TSchema));
}

/**
 * Inserts a value into a union schema, converting the original schema into a union if it isn't
 * already.
 *
 * @category Internal
 */
export function insertUnion({
    insertion,
    originalSchema,
}: {
    originalSchema: TSchema;
    insertion: TSchema;
}): TUnion {
    if (isUnionSchema(originalSchema)) {
        return Type.Union(
            [
                ...originalSchema.anyOf,
                insertion,
            ],
            {
                default: originalSchema.default,
            },
        );
    } else {
        return Type.Union(
            [
                originalSchema,
                Type.Undefined(),
            ],
            {
                default: originalSchema.default,
            },
        );
    }
}

/**
 * Runs a `transform` function on a schema or any part of its union that matches `guard`.
 *
 * @category Internal
 */
export function operateOnExtraction<const Guarded extends TSchema>(
    originalSchema: TSchema,
    guard: (schema: TSchema) => schema is Guarded,
    transform: (schema: Guarded) => TSchema,
): TSchema {
    if (isUnionSchema(originalSchema)) {
        return Type.Union(
            originalSchema.anyOf.map((entry) => {
                if (guard(entry)) {
                    return transform(entry);
                } else {
                    return entry;
                }
            }),
        );
    } else if (guard(originalSchema)) {
        return transform(originalSchema);
    } else {
        return originalSchema;
    }
}
