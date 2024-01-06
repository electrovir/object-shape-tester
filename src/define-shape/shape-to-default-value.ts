import {isObject, mapObjectValues} from '@augment-vir/common';
import {isRunTimeType} from 'run-time-assertions';
import {
    ShapeToRunTimeType,
    getShapeSpecifier,
    isAndShapeSpecifier,
    isEnumShapeSpecifier,
    isExactShapeSpecifier,
    isOrShapeSpecifier,
    isShapeDefinition,
    isUnknownShapeSpecifier,
} from './shape-specifiers';

export function shapeToDefaultValue<Shape, IsReadonly extends boolean = false>(
    shape: Shape,
    isReadonly: IsReadonly = false as IsReadonly,
): ShapeToRunTimeType<Shape, false, IsReadonly> {
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
            }, {});
        } else if (isEnumShapeSpecifier(specifier)) {
            return Object.values(specifier.parts[0])[0];
        } else if (isUnknownShapeSpecifier(specifier)) {
            return 'unknown';
        } else {
            throw new Error(
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
    } else if (isRunTimeType(shape, 'array')) {
        return shape.map(innerShapeToDefaultValue);
    } else if (isObject(shape)) {
        return mapObjectValues(shape, (key, value) => {
            return shapeToDefaultValue(value);
        });
    }
    return shape;
}
