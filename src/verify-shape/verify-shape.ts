import {combineErrorMessages, isObject, isRuntimeTypeOf} from '@augment-vir/common';
import {ShapeDefinition} from '../define-shape/define-shape';
import {
    getShapeSpecifier,
    isAndShapeSpecifier,
    isExactShapeSpecifier,
    isOrShapeSpecifier,
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
    internalAssertValidShape(subject, shapeDefinition.shape, []);
}

function createKeyString(keys: ReadonlyArray<PropertyKey>): string {
    return keys.map((key) => `'${String(key)}'`).join(' -> ');
}

function internalAssertValidShape<Shape>(
    subject: unknown,
    shape: Shape,
    keys: PropertyKey[],
): asserts subject is ShapeDefinition<Shape>['runTimeType'] {
    const keysString = createKeyString(keys);

    const subjectAsSpecifier = getShapeSpecifier(subject);
    if (subjectAsSpecifier) {
        throw new ShapeMismatchError(
            `Shape test subjects cannot be contain shape specifiers but one was found at ${keysString}.`,
        );
    }

    if (!matchesSpecifier(subject, shape)) {
        if (keys.length) {
            throw new ShapeMismatchError(
                `Subject does not match shape definition at key ${keysString}`,
            );
        } else {
            throw new ShapeMismatchError(
                'Subject does not match shape definition at the top level.',
            );
        }
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
            options: {ignoreExtraKeys: boolean} = {ignoreExtraKeys: false},
        ) {
            /* c8 ignore start */
            // just covering edge cases, can't actually trigger this
            if (isObject(shapePart)) {
                /* c8 ignore stop */
                const shapePartKeys = new Set(Object.keys(shapePart));
                if (!options.ignoreExtraKeys) {
                    subjectKeys.forEach((subjectKey) => {
                        if (!shapePartKeys.has(subjectKey)) {
                            throw new ShapeMismatchError(
                                `Subject has extra key '${subjectKey}' in ${keysString}`,
                            );
                        }
                    });
                }
                shapePartKeys.forEach((shapePartKey) => {
                    if (!subjectKeys.has(shapePartKey)) {
                        throw new ShapeMismatchError(
                            `Subject missing key '${shapePartKey}' in ${keysString}`,
                        );
                    }
                });

                subjectKeys.forEach((key) => {
                    const subjectChild = (objectSubject as any)[key] as unknown;
                    if (options.ignoreExtraKeys && !shapePartKeys.has(key)) {
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
