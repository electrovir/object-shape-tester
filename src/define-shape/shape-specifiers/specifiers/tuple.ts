import {
    ExtractInstanceTypes,
    GetAllowedParts,
    SpecifierInstance,
    defineShapeSpecifier,
} from '../define-shape-specifier';

export const tupleSymbol = Symbol('tuple');

export const tuple = defineShapeSpecifier(
    tupleSymbol,
    (parts: Readonly<[...unknown[]]>, predicate) => {
        return parts.every((part, index) => predicate(part, index, {allowExtraKeys: false}));
    },
);

export type TupleCombiner<Instance extends SpecifierInstance<GetAllowedParts<typeof tuple>, any>> =
    {[Index in keyof ExtractInstanceTypes<Instance>[0]]: 4};
