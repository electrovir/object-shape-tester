import {combineErrorMessages, isObject, isRuntimeTypeOf} from '@augment-vir/common';
import {ShapeDefinition} from '../define-shape/define-shape';
import {
    getShapeSpecifier,
    isAndShapeSpecifier,
    isEnumShapeSpecifier,
    isExactShapeSpecifier,
    isOrShapeSpecifier,
    isUnknownShapeSpecifier,
    matchesSpecifier,
} from '../define-shape/shape-specifiers';
import {ShapeMismatchError} from '../errors/shape-mismatch.error';

export function isValidShape<Shape>(
    subject: unknown,
    shapeDefinition: ShapeDefinition<Shape>,
): subject is Shape {
    try {
        assertValidShape(subject, shapeDefinition);
        return true;
    } catch (error) {
        return false;
    }
}

export function assertValidShape<Shape>(
    subject: unknown,
    shapeDefinition: ShapeDefinition<Shape>,
): asserts subject is ShapeDefinition<Shape>['runTimeType'] {
    internalAssertValidShape(subject, shapeDefinition.shape, ['top level']);
}

function createKeyString(keys: ReadonlyArray<PropertyKey>): string {
    return [
        keys[0],
        ...keys.slice(1).map((key) => `'${String(key)}'`),
    ].join(' -> ');
}

function internalAssertValidShape<Shape>(
    subject: unknown,
    shape: Shape,
    keys: PropertyKey[],
): asserts subject is ShapeDefinition<Shape>['runTimeType'] {
    // unknown shape specifier allows anything, abort instantly
    if (isUnknownShapeSpecifier(shape)) {
        return;
    }

    const keysString = createKeyString(keys);

    const subjectAsSpecifier = getShapeSpecifier(subject);
    if (subjectAsSpecifier) {
        throw new ShapeMismatchError(
            `Shape test subjects cannot be contain shape specifiers but one was found at ${keysString}.`,
        );
    }

    if (!matchesSpecifier(subject, shape)) {
        throw new ShapeMismatchError(
            `Subject does not match shape definition at key ${keysString}`,
        );
    }

    if (isObject(subject)) {
        const objectSubject: Record<any, any> = subject;
        const subjectKeys = new Set(Object.keys(objectSubject));
        const keysPassed: Record<any, boolean> = Object.fromEntries(
            Object.keys(objectSubject).map((key) => [
                key,
                false,
            ]),
        );

        function testKeys(
            shapePart: unknown,
            {
                ignoreExtraKeys = false,
            }: {
                ignoreExtraKeys?: boolean;
            } = {
                ignoreExtraKeys: false,
            },
        ) {
            /* c8 ignore start */
            // just covering edge cases, can't actually trigger this
            if (isObject(shapePart)) {
                /* c8 ignore stop */
                const shapePartKeys = new Set(Object.keys(shapePart));
                if (!ignoreExtraKeys) {
                    subjectKeys.forEach((subjectKey) => {
                        if (!shapePartKeys.has(subjectKey)) {
                            throw new ShapeMismatchError(
                                `Subject has extra key '${subjectKey}' in ${keysString}`,
                            );
                        }
                    });
                }
                shapePartKeys.forEach((shapePartKey) => {
                    debugger;
                    const shapeValue = (shapePart as any)[shapePartKey];
                    const orContainsUndefined: boolean = isOrShapeSpecifier(shapeValue)
                        ? shapeValue.parts.includes(undefined)
                        : false;
                    const containsUndefined: boolean =
                        shapeValue?.includes?.(undefined) || shapeValue === undefined;

                    if (
                        !subjectKeys.has(shapePartKey) &&
                        !orContainsUndefined &&
                        !containsUndefined
                    ) {
                        throw new ShapeMismatchError(
                            `Subject missing key '${shapePartKey}' in ${keysString}`,
                        );
                    }
                });

                subjectKeys.forEach((key) => {
                    const subjectChild = (objectSubject as any)[key] as unknown;
                    if (ignoreExtraKeys && !shapePartKeys.has(key)) {
                        return;
                    }
                    const shapePartChild = (shapePart as any)[key] as unknown;

                    internalAssertValidShape(subjectChild, shapePartChild, [
                        ...keys,
                        key,
                    ]);
                    keysPassed[key] = true;
                });
                /* c8 ignore start */
            } else {
                console.error({shapePart, keys});
                throw new ShapeMismatchError(
                    `shape definition at ${keysString} was not an object.`,
                );
            }
            /* c8 ignore stop */
        }

        const errors: ShapeMismatchError[] = [];
        let matched = false;

        if (isOrShapeSpecifier(shape)) {
            matched = shape.parts.some((shapePart) => {
                try {
                    testKeys(shapePart);
                    return true;
                } catch (error) {
                    /* c8 ignore start */
                    // just covering edge cases, can't actually trigger this
                    if (error instanceof ShapeMismatchError) {
                        /* c8 ignore stop */
                        errors.push(error);
                        return false;
                        /* c8 ignore start */
                    } else {
                        throw error;
                    }
                    /* c8 ignore stop */
                }
            });
        } else if (isAndShapeSpecifier(shape)) {
            matched = shape.parts.every((shapePart) => {
                try {
                    testKeys(shapePart, {ignoreExtraKeys: true});
                    return true;
                } catch (error) {
                    /* c8 ignore start */
                    // just covering edge cases, can't actually trigger this
                    if (error instanceof ShapeMismatchError) {
                        /* c8 ignore stop */
                        errors.push(error);
                        return false;
                        /* c8 ignore start */
                    } else {
                        throw error;
                    }
                    /* c8 ignore stop */
                }
            });
        } else if (isExactShapeSpecifier(shape)) {
            testKeys(shape.parts[0]);
            matched = true;
            /* c8 ignore start */
        } else if (isEnumShapeSpecifier(shape)) {
            // just cover an edge case
            throw new ShapeMismatchError(
                `Cannot compare an enum specifier to an object at ${keysString}`,
            );
            /* c8 ignore stop */
        } else if (isRuntimeTypeOf(shape, 'array') && isRuntimeTypeOf(objectSubject, 'array')) {
            // special case arrays
            matched = objectSubject.every((subjectEntry, index): boolean => {
                const passed = shape.some((shapeEntry): boolean => {
                    try {
                        internalAssertValidShape(subjectEntry, shapeEntry, [
                            ...keys,
                            index,
                        ]);
                        return true;
                    } catch (error) {
                        /* c8 ignore start */
                        // just covering edge cases, can't actually trigger this
                        if (error instanceof ShapeMismatchError) {
                            /* c8 ignore stop */
                            errors.push(error);
                            return false;
                            /* c8 ignore start */
                        } else {
                            throw error;
                        }
                        /* c8 ignore stop */
                    }
                });

                keysPassed[index] = passed;

                return passed;
            });
        } else {
            // if we have no specifier, pass in the whole shape itself
            testKeys(shape);
            matched = true;
        }

        if (!matched) {
            throw new ShapeMismatchError(
                combineErrorMessages(errors) /* c8 ignore start */ ||
                    // just covering edge cases
                    'no error message',
                /* c8 ignore stop */
            );
        }

        Object.entries(keysPassed).forEach(
            ([
                key,
                wasTested,
            ]) => {
                if (!wasTested) {
                    throw new ShapeMismatchError(`subject as extra key '${key}' in ${keysString}.`);
                }
            },
        );
    }
}
