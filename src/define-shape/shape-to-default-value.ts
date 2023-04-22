import {isObject, isRuntimeTypeOf, mapObjectValues} from '@augment-vir/common';
import {
    ShapeToRunTimeType,
    getShapeSpecifier,
    isAndShapeSpecifier,
    isEnumShapeSpecifier,
    isExactShapeSpecifier,
    isOrShapeSpecifier,
    isUnknownShapeSpecifier,
} from './shape-specifiers';

export function shapeToDefaultValue<Shape>(shape: Shape): ShapeToRunTimeType<Shape> {
    return innerShapeToDefaultValue(shape);
}

function innerShapeToDefaultValue<Shape>(shape: Shape): any {
    const specifier = getShapeSpecifier(shape);

    if (specifier) {
        if (isOrShapeSpecifier(specifier) || isExactShapeSpecifier(specifier)) {
            return innerShapeToDefaultValue(specifier.parts[0]);
        } else if (isAndShapeSpecifier(specifier)) {
            return specifier.parts.reduce((combined: any, part) => {
                return Object.assign(combined, innerShapeToDefaultValue(part));
            });
        } else if (isEnumShapeSpecifier(specifier)) {
            return Object.values(specifier.parts[0])[0];
        } else if (isUnknownShapeSpecifier(specifier)) {
            return 'unknown';
            /* c8 ignore start */
        } else {
            // covering edge cases
            throw new Error(
                `found specifier but it matches no expected specifiers: ${String(
                    specifier.specifierType,
                )}`,
            );
        }
        /* c8 ignore stop */
    }

    if (shape instanceof RegExp) {
        return shape;
    } else if (isRuntimeTypeOf(shape, 'array')) {
        return shape;
    } else if (isObject(shape)) {
        return mapObjectValues(shape, (key, value) => {
            return shapeToDefaultValue(value);
        });
    }
    return shape;
}
