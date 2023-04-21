import {ArrayElement, AtLeastTuple} from '@augment-vir/common';
import {LiteralToPrimitiveDeep} from 'type-fest';
import {
    ExtractInstanceTypes,
    GetAllowedParts,
    SpecifierInstance,
    defineShapeSpecifier,
} from '../define-shape-specifier';

export const orSymbol = Symbol('or');

export const or = defineShapeSpecifier(orSymbol, (parts: AtLeastTuple<unknown, 1>, predicate) => {
    return parts.some((part, index) => predicate(part, index, {allowExtraKeys: false}));
});

export type OrCombiner<Instance extends SpecifierInstance<GetAllowedParts<typeof or>, any>> =
    ArrayElement<LiteralToPrimitiveDeep<ExtractInstanceTypes<Instance>>>;
