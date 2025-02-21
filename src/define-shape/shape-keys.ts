/**
 * A special key string which is used to tag `ShapeDefinition` instances so that we know they're
 * shape definitions instead of part of the shape itself.
 *
 * This should be a symbol, but TypeScript errors out about "using names that cannot be named" in
 * that case.
 *
 * @category Internal
 */
export const isShapeDefinitionKey =
    '__vir__shape__definition__key__do__not__use__in__actual__objects';

/**
 * A special key string which is used to tag `ShapeSpecifier` instances so that we know they're
 * shape shape specifiers instead of part of the shape itself.
 *
 * This should be a symbol, but TypeScript errors out about "using names that cannot be named" in
 * that case.
 *
 * @category Internal
 */
export const isShapeSpecifierKey =
    '__vir__shape__specifier__key__do__not__use__in__actual__objects';
