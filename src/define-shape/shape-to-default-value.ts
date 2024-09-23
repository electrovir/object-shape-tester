import {check} from '@augment-vir/assert';
import {extractErrorMessage, mapObjectValues} from '@augment-vir/common';
import {DefaultValueConstructionError} from '../errors/default-value-construction.error.js';
import {
    ShapeToRuntimeType,
    expandIndexedKeysKeys,
    getShapeSpecifier,
    isAndShapeSpecifier,
    isClassShapeSpecifier,
    isEnumShapeSpecifier,
    isExactShapeSpecifier,
    isIndexedKeysSpecifier,
    isOrShapeSpecifier,
    isShapeDefinition,
    isUnknownShapeSpecifier,
} from './shape-specifiers.js';

export function shapeToDefaultValue<Shape, IsReadonly extends boolean = false>(
    shape: Shape,
    isReadonly: IsReadonly = false as IsReadonly,
): ShapeToRuntimeType<Shape, false, IsReadonly> {
    return innerShapeToDefaultValue(shape);
}

function innerShapeToDefaultValue<Shape>(shape: Shape): any {
    const specifier = getShapeSpecifier(shape);

    if (specifier) {
        if (isClassShapeSpecifier(specifier)) {
            const classConstructor = specifier.parts[0];
            try {
                return new classConstructor();
            } catch (caught) {
                throw new DefaultValueConstructionError(
                    `Failed to create default value for classShape for class '${classConstructor.name}': ${extractErrorMessage(caught)}`,
                );
            }
        } else if (isOrShapeSpecifier(specifier) || isExactShapeSpecifier(specifier)) {
            return innerShapeToDefaultValue(specifier.parts[0]);
        } else if (isAndShapeSpecifier(specifier)) {
            return specifier.parts.reduce((combined: any, part) => {
                return Object.assign(combined, innerShapeToDefaultValue(part));
            }, {});
        } else if (isEnumShapeSpecifier(specifier)) {
            return Object.values(specifier.parts[0])[0];
        } else if (isIndexedKeysSpecifier(specifier)) {
            const keys = expandIndexedKeysKeys(specifier);

            if (!specifier.parts[0].required || check.isBoolean(keys)) {
                return {};
            }

            return Object.fromEntries(
                keys.map((key) => [
                    key,
                    innerShapeToDefaultValue(specifier.parts[0].values),
                ]),
            );
        } else if (isUnknownShapeSpecifier(specifier)) {
            return specifier.parts[0] ?? {};
            /* v8 ignore next 7: this is an edge case fallback */
        } else {
            throw new DefaultValueConstructionError(
                `found specifier but it matches no expected specifiers: ${String(
                    specifier.specifierType,
                )}`,
            );
        }
    }

    if (isShapeDefinition(shape)) {
        return shapeToDefaultValue(shape.shape);
    } else if (shape instanceof RegExp) {
        return shape;
    } else if (check.isArray(shape)) {
        return shape.map(innerShapeToDefaultValue);
    } else if (check.isObject(shape)) {
        return mapObjectValues(shape, (key, value) => {
            return shapeToDefaultValue(value);
        });
    }
    return shape;
}
