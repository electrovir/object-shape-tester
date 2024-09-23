import {getRuntimeType} from '@augment-vir/assert';

export function haveEqualTypes(subject: unknown, shape: unknown): boolean {
    const shapeConstructor = shape?.constructor;
    const subjectPrototype = (subject as any)?.constructor?.prototype;
    const constructorsEqual = (subject as any)?.constructor === shapeConstructor;
    const constructorsInstanceOf =
        shapeConstructor && subjectPrototype ? subjectPrototype instanceof shapeConstructor : false;

    const constructorsMatch = constructorsEqual || constructorsInstanceOf;
    return getRuntimeType(subject) === getRuntimeType(shape) && constructorsMatch;
}
