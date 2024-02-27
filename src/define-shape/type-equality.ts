import {getRunTimeType} from 'run-time-assertions';

export function haveEqualTypes(subject: unknown, shape: unknown): boolean {
    const shapeConstructor = shape?.constructor;
    const subjectPrototype = (subject as any)?.constructor?.prototype;
    const constructorsEqual = (subject as any)?.constructor === shapeConstructor;
    const constructorsInstanceOf =
        shapeConstructor && subjectPrototype ? subjectPrototype instanceof shapeConstructor : false;

    const constructorsMatch = constructorsEqual || constructorsInstanceOf;
    return getRunTimeType(subject) === getRunTimeType(shape) && constructorsMatch;
}
