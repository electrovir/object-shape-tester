import {
    ExtractInstanceTypes,
    GetAllowedParts,
    SpecifierInstance,
    defineShapeSpecifier,
} from '../define-shape-specifier';

export const exactSymbol = Symbol('exact');

export const exact = defineShapeSpecifier(exactSymbol, (parts: Readonly<[unknown]>, predicate) => {
    return predicate(parts[0], 0, {allowExtraKeys: false});
});

// export const exact: SpecifierDefinition<Readonly<[unknown]>, typeof exactSymbol> = {} as any;

export type ExactCombiner<Instance extends SpecifierInstance<GetAllowedParts<typeof exact>, any>> =
    ExtractInstanceTypes<Instance>[0];
