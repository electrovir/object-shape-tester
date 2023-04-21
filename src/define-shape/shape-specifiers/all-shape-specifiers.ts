import {wrapNarrowTypeWithTypeCheck} from '@augment-vir/common';
import {BaseSpecifierParts, SpecifierDefinition, SpecifierInstance} from './define-shape-specifier';
import {AndCombiner, and} from './specifiers/and';
import {OrCombiner, or} from './specifiers/or';

type AllSpecifiers = {
    [PropSymbol: symbol]: {
        specifier: SpecifierDefinition<BaseSpecifierParts, typeof PropSymbol>;
        combiner: <Instance extends SpecifierInstance<any, any>>(instance: Instance) => any;
    };
};

export const allSpecifiers = wrapNarrowTypeWithTypeCheck<AllSpecifiers>()({
    [or.markerSymbol]: {
        specifier: or,
        combiner<Instance extends SpecifierInstance<any, any>>(
            instance: Instance,
        ): OrCombiner<Instance> {
            throw new Error('only for creating types, do not run at run time');
        },
    },
    [and.markerSymbol]: {
        specifier: and,
        combiner<Instance extends SpecifierInstance<any, any>>(
            instance: Instance,
        ): AndCombiner<Instance> {
            throw new Error('only for creating types, do not run at run time');
        },
    },
} as const);
