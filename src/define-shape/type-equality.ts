export function haveEqualTypes({subject, shape}: {subject: unknown; shape: unknown}): boolean {
    const shapeConstructor = shape?.constructor;
    const subjectPrototype = (subject as any)?.constructor?.prototype;

    const constructorsEqual = (subject as any)?.constructor === shapeConstructor;
    const constructorsInstanceOf =
        shapeConstructor && subjectPrototype ? subjectPrototype instanceof shapeConstructor : false;

    const constructorsMatch =
        constructorsEqual ||
        constructorsInstanceOf ||
        isNullObjectComparison({shapeConstructor, subject});
    return typeof subject === typeof shape && constructorsMatch;
}

function isNullObjectComparison({
    shapeConstructor,
    subject,
}: {
    shapeConstructor: unknown;
    subject: unknown;
}): boolean {
    return (subject as any)?.constructor == undefined && shapeConstructor === Object;
}
