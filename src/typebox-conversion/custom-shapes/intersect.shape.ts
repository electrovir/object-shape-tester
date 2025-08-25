import {type ArrayElement} from '@augment-vir/common';
import {type TUnsafe, Type} from '@sinclair/typebox';
import {type UnionToIntersection} from 'type-fest';
import {defineShape, type ShapeInitType} from '../shape.js';

export function intersectShape<T extends ReadonlyArray<object>>(...inits: T) {
    const combinedDefault = {};
    const schemas: any[] = inits.map((init) => {
        const shape = defineShape(init);
        Object.assign(combinedDefault, shape.default);
        return shape.$_schema;
    });

    return defineShape(
        Type.Composite(schemas, {
            default: combinedDefault,
        }) as any as TUnsafe<UnionToIntersection<ShapeInitType<ArrayElement<T>>>>,
    );
}
