import {getRunTimeType} from 'run-time-assertions';

export function haveEqualTypes(a: unknown, b: unknown): boolean {
    const constructorsMatch = (a as any)?.constructor === (b as any)?.constructor;

    return getRunTimeType(a) === getRunTimeType(b) && constructorsMatch;
}
