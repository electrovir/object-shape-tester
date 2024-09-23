import {check} from '@augment-vir/assert';
import {
    PartialWithUndefined,
    combineErrorMessages,
    ensureErrorAndPrependMessage,
    getObjectTypedKeys,
    mapObjectValues,
} from '@augment-vir/common';
import {
    ShapeDefinition,
    getShapeSpecifier,
    isAndShapeSpecifier,
    isClassShapeSpecifier,
    isEnumShapeSpecifier,
    isExactShapeSpecifier,
    isIndexedKeysSpecifier,
    isOrShapeSpecifier,
    isShapeDefinition,
    isUnknownShapeSpecifier,
    matchesSpecifier,
} from '../define-shape/shape-specifiers.js';
import {ShapeMismatchError} from '../errors/shape-mismatch.error.js';

export type CheckShapeValidityOptions = {
    allowExtraKeys: boolean;
};

export function isValidShape<Shape, IsReadonly extends boolean>(
    subject: unknown,
    shapeDefinition: ShapeDefinition<Shape, IsReadonly>,
    options: PartialWithUndefined<CheckShapeValidityOptions> = {},
): subject is ShapeDefinition<Shape, IsReadonly>['runtimeType'] {
    try {
        assertValidShape(subject, shapeDefinition, options);
        return true;
    } catch {
        return false;
    }
}

export function assertValidShape<Shape, IsReadonly extends boolean>(
    subject: unknown,
    shapeDefinition: ShapeDefinition<Shape, IsReadonly>,
    options: PartialWithUndefined<CheckShapeValidityOptions> = {},
    failureMessage = '',
): asserts subject is ShapeDefinition<Shape, IsReadonly>['runtimeType'] {
    try {
        internalAssertValidShape({
            subject,
            shape: shapeDefinition.shape,
            keys: ['top level'],
            options: {
                exactValues: false,
                ignoreExtraKeys: !!options.allowExtraKeys,
            },
        });
    } catch (error) {
        if (failureMessage) {
            throw ensureErrorAndPrependMessage(error, failureMessage);
        } else {
            throw error;
        }
    }
}

function createKeyString(keys: ReadonlyArray<PropertyKey>): string {
    return [
        keys[0],
        ...keys.slice(1).map((key) => `'${String(key)}'`),
    ].join(' -> ');
}

type InternalIsValidShapeOptions = {
    ignoreExtraKeys: boolean;
    exactValues: boolean;
};

function internalAssertValidShape<Shape>({
    subject,
    shape,
    keys,
    options,
}: {
    subject: unknown;
    shape: Shape;
    keys: ReadonlyArray<PropertyKey>;
    options: InternalIsValidShapeOptions;
}): boolean | Record<PropertyKey, boolean> {
    // unknown shape specifier allows anything, abort instantly
    if (isUnknownShapeSpecifier(shape)) {
        return true;
    }
    if (isShapeDefinition(shape)) {
        return internalAssertValidShape({subject, shape: shape.shape, keys, options});
    }

    const keysString = createKeyString(keys);

    const subjectAsSpecifier = getShapeSpecifier(subject);
    if (subjectAsSpecifier) {
        throw new ShapeMismatchError(
            `Shape test subjects cannot be contain shape specifiers but one was found at ${keysString}.`,
        );
    }

    if (!matchesSpecifier(subject, shape, !options.ignoreExtraKeys)) {
        throw new ShapeMismatchError(
            `Subject does not match shape definition at key ${keysString}`,
        );
    }

    if (check.isFunction(shape)) {
        return check.isFunction(subject);
    }

    if (isClassShapeSpecifier(shape)) {
        return subject instanceof shape.parts[0];
    }

    if (check.isObject(subject)) {
        const objectSubject: Record<any, any> = subject;
        const keysPassed: Record<PropertyKey, boolean> = options.ignoreExtraKeys
            ? {}
            : Object.fromEntries(
                  Object.keys(objectSubject).map((key) => [
                      key,
                      false,
                  ]),
              );

        const errors: string[] = [];
        let matched = false;

        if (isOrShapeSpecifier(shape)) {
            const orErrors: string[] = [];
            matched = shape.parts.some((shapePart) => {
                try {
                    const newKeysPassed = internalAssertValidShape({
                        subject,
                        shape: shapePart,
                        keys,
                        options: {
                            ...options,
                        },
                    });
                    Object.assign(keysPassed, newKeysPassed);
                    return true;
                } catch (error) {
                    if (error instanceof ShapeMismatchError) {
                        orErrors.push(error.message);
                        return false;
                    } else {
                        throw error;
                    }
                }
            });

            if (!matched && check.isLengthAtLeast(orErrors, 1)) {
                errors.push(orErrors[0]);
            }
        } else if (isAndShapeSpecifier(shape)) {
            matched = shape.parts.every((shapePart) => {
                try {
                    const newPassedKeys = internalAssertValidShape({
                        subject,
                        shape: shapePart,
                        keys,
                        options: {
                            ...options,
                            ignoreExtraKeys: true,
                        },
                    });
                    Object.assign(keysPassed, newPassedKeys);
                    return true;
                } catch (error) {
                    if (error instanceof ShapeMismatchError) {
                        errors.push(error.message);
                        return false;
                    } else {
                        throw error;
                    }
                }
            });
        } else if (isExactShapeSpecifier(shape)) {
            const newKeysPassed = internalAssertValidShape({
                subject,
                shape: shape.parts[0],
                keys,
                options: {
                    ...options,
                    exactValues: true,
                },
            });
            Object.assign(keysPassed, newKeysPassed);
            matched = true;
        } else if (isEnumShapeSpecifier(shape)) {
            throw new ShapeMismatchError(
                `Cannot compare an enum specifier to an object at ${keysString}`,
            );
        } else if (check.isArray(shape) && check.isArray(objectSubject)) {
            // special case arrays
            matched = objectSubject.every((subjectEntry, index): boolean => {
                const passed = shape.some((shapeEntry): boolean => {
                    try {
                        internalAssertValidShape({
                            subject: subjectEntry,
                            shape: shapeEntry,
                            keys: [
                                ...keys,
                                index,
                            ],
                            options,
                        });
                        return true;
                    } catch (error) {
                        if (error instanceof ShapeMismatchError) {
                            errors.push(error.message);
                            return false;
                            /* v8 ignore next 3: edge case catch for internal errors*/
                        } else {
                            throw error;
                        }
                    }
                });

                keysPassed[index] = passed;

                return passed;
            });
        } else if (isIndexedKeysSpecifier(shape)) {
            const newKeysPassed = mapObjectValues(subject, (key, value) => {
                if (!options.ignoreExtraKeys) {
                    internalAssertValidShape({
                        shape: shape.parts[0].keys,
                        subject: key,
                        keys: [
                            ...keys,
                            key,
                        ],
                        options,
                    });
                }
                internalAssertValidShape({
                    shape: shape.parts[0].values,
                    subject: value,
                    keys: [
                        ...keys,
                        key,
                    ],
                    options,
                });

                return true;
            });

            Object.assign(keysPassed, newKeysPassed);
            matched = true;
        } else {
            // if we have no specifier, pass in the whole shape itself
            const newKeysPassed = isValidRawObjectShape({
                keys,
                options,
                shape,
                subject,
            });
            Object.assign(keysPassed, newKeysPassed);
            matched = true;
        }

        if (errors.length) {
            throw new ShapeMismatchError(combineErrorMessages(errors));
        }

        if (!matched) {
            const failedKeys = Object.keys(keysPassed).filter((key) => {
                return !keysPassed[key];
            });
            const errorMessage = `Failed on key(s): ${failedKeys
                .map((failedKey) =>
                    createKeyString([
                        ...keys,
                        failedKey,
                    ]),
                )
                .join(',')}`;
            throw new ShapeMismatchError(errorMessage);
        }

        if (!options.ignoreExtraKeys) {
            Object.entries(keysPassed).forEach(
                ([
                    key,
                    wasTested,
                ]) => {
                    if (!wasTested) {
                        throw new ShapeMismatchError(
                            `subject as extra key '${key}' in ${keysString}.`,
                        );
                    }
                },
            );
        }
        return keysPassed;
    } else if (options.exactValues) {
        return subject === shape;
    }

    return true;
}

function isValidRawObjectShape<Shape>({
    keys,
    options,
    shape,
    subject,
}: {
    keys: ReadonlyArray<PropertyKey>;
    options: InternalIsValidShapeOptions;
    shape: Shape;
    subject: object;
}) {
    const keysString = createKeyString(keys);
    const keysPassed: Record<PropertyKey, boolean> = {};

    if (check.isObject(shape)) {
        const shapeKeys = new Set<PropertyKey>(getObjectTypedKeys(shape));
        const subjectKeys = new Set<PropertyKey>(getObjectTypedKeys(subject));

        shapeKeys.forEach((shapeKey) => {
            // try to account for non-enumerable keys
            if (shapeKey in subject) {
                subjectKeys.add(shapeKey);
            }
        });

        if (!options.ignoreExtraKeys) {
            subjectKeys.forEach((subjectKey) => {
                if (!shapeKeys.has(subjectKey)) {
                    throw new ShapeMismatchError(
                        `Subject has extra key '${String(subjectKey)}' in ${keysString}`,
                    );
                }
            });
        }
        shapeKeys.forEach((shapePartKey) => {
            const shapeValue = (shape as any)[shapePartKey];
            const orContainsUndefined: boolean = isOrShapeSpecifier(shapeValue)
                ? shapeValue.parts.includes(undefined)
                : false;
            const containsUndefined: boolean =
                shapeValue?.includes?.(undefined) || shapeValue === undefined;

            if (!subjectKeys.has(shapePartKey) && !orContainsUndefined && !containsUndefined) {
                throw new ShapeMismatchError(
                    `Subject missing key '${String(shapePartKey)}' in ${keysString}`,
                );
            }
        });

        subjectKeys.forEach((key) => {
            const subjectChild = (subject as any)[key] as unknown;
            if (options.ignoreExtraKeys && !shapeKeys.has(key)) {
                return;
            }
            const shapePartChild = (shape as any)[key] as unknown;
            internalAssertValidShape({
                subject: subjectChild,
                shape: shapePartChild,
                keys: [
                    ...keys,
                    key,
                ],
                options,
            });
            keysPassed[key] = true;
        });
        /* v8 ignore next 3: edge case handling */
    } else {
        throw new ShapeMismatchError(`shape definition at ${keysString} was not an object.`);
    }

    return keysPassed;
}
