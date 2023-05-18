import {getRuntimeTypeOf} from '@augment-vir/common';

export function haveEqualTypes(a: unknown, b: unknown): boolean {
    const constructorsMatch = (a as any)?.constructor === (b as any)?.constructor;

    return getRuntimeTypeOf(a) === getRuntimeTypeOf(b) && constructorsMatch;
}
