import {check} from '@augment-vir/assert';
import {
    type PartialWithUndefined,
    combineErrorMessages,
    ensureErrorAndPrependMessage,
    getObjectTypedKeys,
    getObjectTypedValues,
    mapObjectValues,
    stringify,
} from '@augment-vir/common';
import {isCustomSpecifier} from '../define-shape/custom-specifier.js';
import {
    type BaseIndexedKeys,
    type ShapeDefinition,
    type ShapeIndexedKeys,
    getShapeSpecifier,
    indexedKeys,
    isAndShapeSpecifier,
    isClassShapeSpecifier,
    isEnumShapeSpecifier,
    isExactShapeSpecifier,
    isIndexedKeysSpecifier,
    isNumericRangeShapeSpecifier,
    isOptionalShapeSpecifier,
    isOrShapeSpecifier,
    isShapeDefinition,
    isTupleShapeSpecifier,
    isUnknownShapeSpecifier,
} from '../define-shape/shape-specifiers.js';
import {haveEqualTypes} from '../define-shape/type-equality.js';
import {ShapeMismatchError} from '../errors/shape-mismatch.error.js';

/**
 * Extra options for {@link isValidShape} and {@link assertValidShape}.
 *
 * @category Util
 */
export type CheckShapeValidityOptions = {
    allowExtraKeys: boolean;
};

/**
 * Check if a variable matches the given shape.
 *
 * @category Main
 * @example
 *
 * ```ts
 * import {defineShape, isValidShape} from 'object-shape-tester';
 *
 * const myShape = defineShape({
 *     a: '',
 * });
 *
 * isValidShape({a: 'hi'}, myShape); // `true`
 * isValidShape({a: 3}, myShape); // `false`
 * isValidShape({a: 'hi', b: 'bye'}, {allowExtraKeys: true}, myShape); // `true`
 * ```
 *
 * @returns `true` or `false`
 */
export function isValidShape<
    Shape extends ShapeDefinition<any, IsReadonly>,
    IsReadonly extends boolean,
>(
    subject: unknown,
    shapeDefinition: Shape,
    options: PartialWithUndefined<CheckShapeValidityOptions> = {},
): subject is Shape['runtimeType'] {
    try {
        assertValidShape(subject, shapeDefinition, options);
        return true;
    } catch {
        return false;
    }
}

/**
 * Check if a variable matches the given shape. Returns the variable if it matches, otherwise
 * returns `undefined`
 *
 * @category Main
 * @example
 *
 * ```ts
 * import {defineShape, checkWrapValidShape} from 'object-shape-tester';
 *
 * const myShape = defineShape({
 *     a: '',
 * });
 *
 * checkWrapValidShape({a: 'hi'}, myShape); // returns `{a: 'hi'}`
 * checkWrapValidShape({a: 3}, myShape); // returns `undefined`
 * checkWrapValidShape({a: 'hi', b: 'bye'}, {allowExtraKeys: true}, myShape); // returns `{a: 'hi', b: 'bye'}`
 * ```
 *
 * @returns `true` or `false`
 */
export function checkWrapValidShape<
    Shape extends ShapeDefinition<any, IsReadonly>,
    IsReadonly extends boolean,
>(
    subject: unknown,
    shapeDefinition: Shape,
    options: PartialWithUndefined<CheckShapeValidityOptions> = {},
): Shape['runtimeType'] | undefined {
    if (isValidShape(subject, shapeDefinition, options)) {
        return subject;
    } else {
        return undefined;
    }
}

/**
 * Assets that a variable matches the given shape and then returns the variable.
 *
 * @category Main
 * @example
 *
 * ```ts
 * import {defineShape, assertWrapValidShape} from 'object-shape-tester';
 *
 * const myShape = defineShape({
 *     a: '',
 * });
 *
 * assertValidShape({a: 'hi'}, myShape); // returns `{a: 'hi'}`
 * assertValidShape({a: 'hi', b: 'bye'}, myShape, {allowExtraKeys: true}); // returns `{a: 'hi', b: 'bye'}`
 * assertValidShape({a: 3, myShape}); // throws an error
 * ```
 *
 * @throws {@link ShapeMismatchError} If there is a mismatch
 */
export function assertWrapValidShape<
    Shape extends ShapeDefinition<any, IsReadonly>,
    IsReadonly extends boolean,
>(
    subject: unknown,
    shapeDefinition: Shape,
    options: PartialWithUndefined<CheckShapeValidityOptions> = {},
    failureMessage = '',
): Shape['runtimeType'] {
    assertValidShape(subject, shapeDefinition, options, failureMessage);
    return subject;
}

/**
 * Assets that a variable matches the given shape.
 *
 * @category Main
 * @example
 *
 * ```ts
 * import {defineShape, assertValidShape} from 'object-shape-tester';
 *
 * const myShape = defineShape({
 *     a: '',
 * });
 *
 * assertValidShape({a: 'hi'}, myShape); // succeeds
 * assertValidShape({a: 'hi', b: 'bye'}, myShape, {allowExtraKeys: true}); // succeeds
 * assertValidShape({a: 3, myShape}); // fails
 * ```
 *
 * @throws {@link ShapeMismatchError} If there is a mismatch
 */
export function assertValidShape<
    Shape extends ShapeDefinition<any, IsReadonly>,
    IsReadonly extends boolean,
>(
    subject: unknown,
    shapeDefinition: Shape,
    options: PartialWithUndefined<CheckShapeValidityOptions> = {},
    failureMessage = '',
): asserts subject is Shape['runtimeType'] {
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

/**
 * Options for shape validation.
 *
 * @category Internal
 */
export type InternalIsValidShapeOptions = {
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
    } else if (isShapeDefinition(shape)) {
        return internalAssertValidShape({subject, shape: shape.shape, keys, options});
    } else if (isCustomSpecifier(shape)) {
        if (!shape.checker(subject)) {
            throw new ShapeMismatchError(
                `Subject ${stringify(subject)} does not match ${shape.customName} shape.`,
            );
        }
        return true;
    }

    const keysString = createKeyString(keys);

    const subjectAsSpecifier = getShapeSpecifier(subject);
    if (subjectAsSpecifier) {
        throw new ShapeMismatchError(
            `Shape test subjects cannot be contain shape specifiers but one was found at ${keysString}.`,
        );
    } else if (isTupleShapeSpecifier(shape)) {
        if (!check.isArray(subject)) {
            throw new ShapeMismatchError(
                `Subject is not an array and cannot match tuple definition at key ${keysString}`,
            );
        }

        return shape.parts.every((shapeEntry, index) => {
            const subjectValue = subject[index];
            return internalAssertValidShape({
                keys: [
                    ...keys,
                    index,
                ],
                options,
                shape: shapeEntry,
                subject: subjectValue,
            });
        });
    } else if (isOptionalShapeSpecifier(shape)) {
        /**
         * The optional specifier does not add any extra restrictions when the subject actually
         * exists. Thus, we'll just compare the subject to the optional shape's input.
         */
        return internalAssertValidShape({
            keys,
            options,
            shape: shape.parts[0],
            subject,
        });
    } else if (!matchesShape(subject, shape, keys, options)) {
        throw new ShapeMismatchError(
            `Subject does not match shape definition at key ${keysString}`,
        );
    } else if (check.isFunction(shape)) {
        return check.isFunction(subject);
    } else if (isClassShapeSpecifier(shape)) {
        return subject instanceof shape.parts[0];
    } else if (subject && typeof subject === 'object') {
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
                        options,
                    });
                    Object.assign(keysPassed, newKeysPassed);
                    return true;
                    /* node:coverage ignore next 14 */
                    /** Cover the edge case of errors. */
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
                    /* node:coverage ignore next 9 */
                    /** Cover the edge case of errors. */
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
            /* node:coverage ignore next 8 */
        } else if (isEnumShapeSpecifier(shape)) {
            /**
             * Technically this case should never get triggered because oft he earlier
             * `!matchesShape` check.
             */
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
            /** If we have no specifier, check the whole object. */
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

        /* node:coverage ignore next 15 */
        /** This might not actually be necessary anymore, I can't get it to trigger in tests. */
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
            if (
                /** Account for non-enumerable keys. */
                shapeKey in subject ||
                /** Account for optional keys. */
                isOptionalShapeSpecifier(shape[shapeKey])
            ) {
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
            /** If the key doesn't exist and it's optional, mark it as passed. */
            if (!(key in subject) && isOptionalShapeSpecifier(shape[key])) {
                keysPassed[key] = true;
                return;
            }
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
        throw new ShapeMismatchError(`Shape definition at ${keysString} was not an object.`);
    }

    return keysPassed;
}

/**
 * Checks if the given `subject` matches the given `shape`.
 *
 * @category Internal
 */
export function matchesShape(
    subject: unknown,
    shape: unknown,
    keys: ReadonlyArray<PropertyKey>,
    options: InternalIsValidShapeOptions,
    checkValues?: boolean | undefined,
): boolean {
    const specifier = getShapeSpecifier(shape);

    if (specifier) {
        if (isCustomSpecifier(specifier)) {
            return specifier.checker(subject);
        } else if (isNumericRangeShapeSpecifier(specifier)) {
            if (!check.isNumber(subject)) {
                return false;
            }
            return subject >= specifier.parts[0] && subject <= specifier.parts[1];
        } else if (isClassShapeSpecifier(specifier)) {
            return subject instanceof specifier.parts[0];
        } else if (isAndShapeSpecifier(specifier)) {
            return specifier.parts.every((part) => {
                try {
                    internalAssertValidShape({
                        subject,
                        shape: part,
                        keys,
                        options: {
                            ...options,
                            ignoreExtraKeys: true,
                        },
                    });
                    return true;
                } catch {
                    return false;
                }
            });
        } else if (isOrShapeSpecifier(specifier)) {
            return specifier.parts.some((part) => {
                try {
                    internalAssertValidShape({subject, shape: part, keys, options});
                    return true;
                } catch {
                    return false;
                }
            });
        } else if (isExactShapeSpecifier(specifier)) {
            if (check.isObject(subject)) {
                internalAssertValidShape({
                    subject,
                    shape: specifier.parts[0],
                    keys,
                    options: {
                        ...options,
                        exactValues: true,
                    },
                });
                return true;
            } else {
                return subject === specifier.parts[0];
            }
        } else if (isEnumShapeSpecifier(specifier)) {
            return check.hasValue(Object.values(specifier.parts[0]), subject);
        } else if (isIndexedKeysSpecifier(specifier)) {
            if (!check.isObject(subject)) {
                return false;
            }
            const matchesKeys = matchesIndexedKeysSpecifierKeys(
                subject,
                specifier,
                !!options.ignoreExtraKeys,
            );
            const matchesValues = getObjectTypedValues(subject).every((subjectValue) => {
                try {
                    internalAssertValidShape({
                        subject: subjectValue,
                        shape: specifier.parts[0].values,
                        keys,
                        options,
                    });
                    return true;
                } catch {
                    return false;
                }
            });

            return matchesKeys && matchesValues;
        } else if (isUnknownShapeSpecifier(specifier)) {
            return true;
        }
    }
    if (checkValues) {
        return shape === subject;
    } else {
        return haveEqualTypes({subject, shape});
    }
}

function matchesIndexedKeysSpecifierKeys(
    subject: object,
    specifier: ShapeIndexedKeys<Readonly<[BaseIndexedKeys]>>,
    ignoreExtraKeys: boolean,
): boolean {
    const required = specifier.parts[0].required;
    const keys = specifier.parts[0].keys;

    const allRequiredKeys = expandIndexedKeysKeys(specifier);

    if (check.isBoolean(allRequiredKeys)) {
        return getObjectTypedKeys(subject).every((subjectKey) => {
            return matchesShape(subjectKey, keys, [], {exactValues: false, ignoreExtraKeys});
        });
    }

    const matchesRequiredKeys: boolean = required
        ? allRequiredKeys.every((requiredKey) => {
              return getObjectTypedKeys(subject).some((subjectKey) =>
                  matchesShape(
                      subjectKey,
                      requiredKey,
                      [],
                      {
                          exactValues: false,
                          ignoreExtraKeys: false,
                      },
                      true,
                  ),
              );
          })
        : true;

    const matchesExistingKeys: boolean = getObjectTypedKeys(subject).every((subjectKey) => {
        const isExpectedKey = allRequiredKeys.includes(subjectKey);

        if (isExpectedKey) {
            return matchesShape(subjectKey, keys, [], {exactValues: false, ignoreExtraKeys: false});
        } else {
            return ignoreExtraKeys;
        }
    });

    return matchesExistingKeys && matchesRequiredKeys;
}

/**
 * Expands an {@link indexedKeys} shape part into an array of its valid keys.
 *
 * @category Internal
 * @returns `true` if any keys are allowed. `false` if a bounded set of keys cannot be determined.
 *   `PropertyKey[]` if there's a specific set of keys that can be extracted.
 */
export function expandIndexedKeysKeys(
    specifier: ShapeIndexedKeys<Readonly<[BaseIndexedKeys]>>,
): PropertyKey[] | boolean {
    const keys = specifier.parts[0].keys;

    const nestedSpecifier = getShapeSpecifier(keys);

    if (check.isPropertyKey(keys)) {
        return true;
    } else if (nestedSpecifier) {
        if (isClassShapeSpecifier(nestedSpecifier)) {
            return false;
        } else if (isAndShapeSpecifier(nestedSpecifier)) {
            return false;
        } else if (isOrShapeSpecifier(nestedSpecifier)) {
            const nestedPropertyKeys = nestedSpecifier.parts.map((part) => {
                return expandIndexedKeysKeys(
                    indexedKeys({
                        ...specifier.parts[0],
                        keys: part as any,
                    }),
                );
            });

            if (nestedPropertyKeys.includes(false)) {
                return false;
            }

            return nestedPropertyKeys.flat().filter(check.isPropertyKey);
        } else if (isExactShapeSpecifier(nestedSpecifier)) {
            const propertyKeyParts = nestedSpecifier.parts.filter(check.isPropertyKey);
            if (propertyKeyParts.length !== nestedSpecifier.parts.length) {
                return false;
            }
            return propertyKeyParts;
        } else if (isEnumShapeSpecifier(nestedSpecifier)) {
            return Object.values(nestedSpecifier.parts[0]);
        } else if (isIndexedKeysSpecifier(nestedSpecifier)) {
            return false;
        } else if (isUnknownShapeSpecifier(nestedSpecifier)) {
            return true;
        }
    }

    return false;
}
