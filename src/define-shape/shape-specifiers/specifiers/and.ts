import {ArrayElement, AtLeastTuple} from '@augment-vir/common';
import {LiteralToPrimitiveDeep, UnionToIntersection} from 'type-fest';
import {
    ExtractInstanceTypes,
    GetAllowedParts,
    SpecifierInstance,
    defineShapeSpecifier,
} from '../define-shape-specifier';

export const andSymbol = Symbol('and');

export const and = defineShapeSpecifier(andSymbol, (parts: AtLeastTuple<unknown, 1>, predicate) => {
    return parts.every((part, index) => predicate(part, index, {allowExtraKeys: true}));
});

export type AndCombiner<Instance extends SpecifierInstance<GetAllowedParts<typeof and>, any>> =
    UnionToIntersection<ArrayElement<LiteralToPrimitiveDeep<ExtractInstanceTypes<Instance>>>>;
