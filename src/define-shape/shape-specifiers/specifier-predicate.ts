import {ArrayElement} from '@augment-vir/common';
import {BaseSpecifierParts} from './define-shape-specifier';

export type SpecifierPredicateOptions = {allowExtraKeys: boolean};

export type SpecifierPredicate<AllowedParts extends BaseSpecifierParts> = (
    part: ArrayElement<Readonly<AllowedParts>>,
    index: number,
    options: SpecifierPredicateOptions,
) => boolean;
