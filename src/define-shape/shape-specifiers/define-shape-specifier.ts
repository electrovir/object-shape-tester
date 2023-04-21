import {AtLeastTuple, DeepWriteable, typedHasProperty} from '@augment-vir/common';
import {SpecifierPredicate} from './specifier-predicate';

const isShapeSpecifierSymbol = Symbol('is-shape-specifier');

export function isShapeSpecifier(
    maybeSpecifier: unknown,
): maybeSpecifier is SpecifierInstance<BaseSpecifierParts, symbol> {
    if (!typedHasProperty(maybeSpecifier, 'isShapeSpecifier')) {
        return false;
    }

    return maybeSpecifier.isShapeSpecifier === isShapeSpecifierSymbol;
}

export type BaseSpecifierParts = Readonly<AtLeastTuple<unknown, 0>>;

type AssertValidPartsCallback<AllowedParts extends BaseSpecifierParts> = (
    parts: AllowedParts,
    predicate: SpecifierPredicate<AllowedParts>,
) => boolean;

export type SpecifierInstance<Parts extends BaseSpecifierParts, MarkerSymbol extends symbol> = {
    isShapeSpecifier: typeof isShapeSpecifierSymbol;
    markerSymbol: MarkerSymbol;
    asserter: (predicate: SpecifierPredicate<Parts>) => boolean;
};

export type SpecifierDefinitionFunction<
    AllowedParts extends BaseSpecifierParts,
    MarkerSymbol extends symbol,
> = <const Parts extends AllowedParts>(...parts: Parts) => SpecifierInstance<Parts, MarkerSymbol>;

type SpecifierDefinitionMarker<MarkerSymbol extends symbol> = {markerSymbol: MarkerSymbol};

export type SpecifierDefinition<
    AllowedParts extends BaseSpecifierParts,
    MarkerSymbol extends symbol,
> = SpecifierDefinitionFunction<AllowedParts, MarkerSymbol> &
    SpecifierDefinitionMarker<MarkerSymbol>;

export function defineShapeSpecifier<
    AllowedParts extends BaseSpecifierParts,
    MarkerSymbol extends symbol,
>(
    markerSymbol: MarkerSymbol,
    partsAsserter: AssertValidPartsCallback<AllowedParts>,
): SpecifierDefinition<AllowedParts, MarkerSymbol> {
    const definition: SpecifierDefinitionFunction<AllowedParts, MarkerSymbol> = <
        Parts extends AllowedParts,
    >(
        ...parts: Parts
    ): SpecifierInstance<Parts, MarkerSymbol> => {
        return {
            isShapeSpecifier: isShapeSpecifierSymbol,
            markerSymbol: markerSymbol,
            asserter: (predicate: SpecifierPredicate<AllowedParts>) =>
                partsAsserter(parts, predicate),
        };
    };

    const marker: SpecifierDefinitionMarker<MarkerSymbol> = {markerSymbol};

    Object.assign(definition, marker);

    return definition as SpecifierDefinition<AllowedParts, MarkerSymbol>;
}

export type GetAllowedParts<Specifier extends SpecifierDefinition<any, any>> =
    Specifier extends SpecifierDefinition<infer AllowedParts, any>
        ? AllowedParts
        : 'Input does not extend ShapeSpecifierDefinition';

export type ExtractInstanceTypes<Specifier extends SpecifierInstance<any, any>> =
    Specifier extends SpecifierInstance<infer AllowedParts, any>
        ? DeepWriteable<AllowedParts>
        : 'Input does not extend ShapeSpecifierInstance';
