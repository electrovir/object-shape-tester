import {itCases} from '@augment-vir/browser-testing';
import {randomInteger, randomString} from '@augment-vir/common';
import {assertTypeOf} from 'run-time-assertions';
import {defineShape} from './define-shape';
import {
    and,
    classShape,
    enumShape,
    exact,
    getShapeSpecifier,
    indexedKeys,
    matchesSpecifier,
    or,
    unknownShape,
} from './shape-specifiers';

enum TestEnum {
    First = 'first',
    Second = 'second',
    Third = 'third',
}

describe('ShapeToRunTimeType', () => {
    it('converts specifiers into their part types', () => {
        const shapeDefinition = defineShape({
            stringProp: 'hello',
            nestedObjectProp: {
                nestedString: '',
                nestedMaybeNumber: or(0, undefined),
                myNestedAnd: and('', 0),
            },
            myOr: or('', 0),
            myAnd: and('', 0),
            mySimpleArray: [''],
            myClassShape: classShape(Error),
            complexArray: [
                '',
                0,
            ],
            idk: unknownShape(),
            myEnum: enumShape(TestEnum),
            myMultiArray: [
                '',
                0,
            ],

            myObjectOr: or(
                {
                    hello: 'there',
                    why: exact('are we here', 'are you there'),
                },
                0,
            ),
            myExactObject: exact({
                nestedExact: 'hello',
                moreNestedExact: 'why',
            }),
            myExact: exact('hello there'),
        });

        assertTypeOf<typeof shapeDefinition.runTimeType>().toEqualTypeOf<{
            stringProp: string;
            nestedObjectProp: {
                nestedString: string;
                nestedMaybeNumber: number | undefined;
                myNestedAnd: string & number;
            };
            myOr: string | number;
            myAnd: string & number;
            mySimpleArray: string[];
            myClassShape: Error;
            complexArray: (string | number)[];
            idk: unknown;
            myEnum: TestEnum;
            myMultiArray: (string | number)[];
            myObjectOr:
                | {
                      hello: string;
                      why: 'are we here' | 'are you there';
                  }
                | number;
            myExactObject: {
                nestedExact: 'hello';
                moreNestedExact: 'why';
            };
            myExact: 'hello there';
        }>();
    });

    it('applies readonly', () => {
        const shapeDefinition = defineShape(
            {
                stringProp: 'hello',
                nestedObjectProp: {
                    nestedString: '',
                    nestedMaybeNumber: or(0, undefined),
                    myNestedAnd: and('', 0),
                },
                myOr: or('', 0),
                myAnd: and('', 0),
                mySimpleArray: [''],
                myClassShape: classShape(Error),
                complexArray: [
                    '',
                    0,
                ],
                idk: unknownShape(),
                myEnum: enumShape(TestEnum),
                myMultiArray: [
                    '',
                    0,
                ],
                myObjectOr: or(
                    {
                        hello: 'there',
                        why: exact('are we here', 'are you there'),
                    },
                    0,
                ),
                myExactObject: exact({
                    nestedExact: 'hello',
                    moreNestedExact: 'why',
                }),
                myExact: exact('hello there'),
            },
            true,
        );

        assertTypeOf<typeof shapeDefinition.runTimeType>().toEqualTypeOf<
            Readonly<{
                stringProp: string;
                nestedObjectProp: Readonly<{
                    nestedString: string;
                    nestedMaybeNumber: number | undefined;
                    myNestedAnd: string & number;
                }>;
                myOr: string | number;
                myAnd: string & number;
                mySimpleArray: ReadonlyArray<string>;
                myClassShape: Readonly<Error>;
                complexArray: ReadonlyArray<string | number>;
                idk: unknown;
                myEnum: TestEnum;
                myMultiArray: ReadonlyArray<string | number>;
                myObjectOr:
                    | Readonly<{
                          hello: string;
                          why: 'are we here' | 'are you there';
                      }>
                    | number;
                myExactObject: Readonly<{
                    nestedExact: 'hello';
                    moreNestedExact: 'why';
                }>;
                myExact: 'hello there';
            }>
        >();
    });

    it('works with exact strings', () => {
        const myShape = defineShape({message: exact('hello')});
        type MyType = typeof myShape.runTimeType;

        assertTypeOf<MyType>().toEqualTypeOf<{
            message: 'hello';
        }>();
    });

    it('works with exact indexed keys', () => {
        const shapeWithIndexedKeys = defineShape({
            thing: '',
            nestedValues: indexedKeys({
                keys: or(exact('hi'), exact('bye')),
                values: {
                    helloThere: 0,
                },
            }),
        });

        assertTypeOf<typeof shapeWithIndexedKeys.runTimeType>().toEqualTypeOf<{
            thing: string;
            nestedValues: Partial<Record<'hi' | 'bye', {helloThere: number}>>;
        }>();
    });

    it('works with vague string indexed keys', () => {
        const shapeWithIndexedKeys = defineShape({
            thing: '',
            nestedValues: indexedKeys({
                keys: '',
                values: 0,
            }),
        });

        assertTypeOf<typeof shapeWithIndexedKeys.runTimeType>().toEqualTypeOf<{
            thing: string;
            nestedValues: Partial<Record<string, number>>;
        }>();
    });
});

describe(matchesSpecifier.name, () => {
    itCases(matchesSpecifier, [
        {
            it: 'always true for unknown specifier',
            inputs: [
                Math.random() > 0.5 ? '' : 4,
                unknownShape(),
            ],
            expect: true,
        },
        {
            it: 'accepts a valid indexed subject',
            inputs: [
                {[randomString()]: randomInteger({max: 100, min: 0})},
                indexedKeys({
                    keys: '',
                    values: 0,
                }),
            ],
            expect: true,
        },
        {
            it: 'rejects indexedKeys subject that is not an object',
            inputs: [
                5,
                indexedKeys({
                    keys: '',
                    values: 0,
                }),
            ],
            expect: false,
        },
        {
            it: 'accepts string/number indexedKeys subject keys mismatch because number keys are casted to strings anyway',
            inputs: [
                {0: 0},
                indexedKeys({
                    keys: '',
                    values: 0,
                }),
            ],
            expect: true,
        },
        {
            it: 'rejects mismatched exact indexedKeys keys',
            inputs: [
                {no: 0},
                indexedKeys({
                    keys: exact('hi'),
                    values: 0,
                }),
            ],
            expect: false,
        },
        {
            it: 'accepts valid exact indexedKeys keys',
            inputs: [
                {hi: 0},
                indexedKeys({
                    keys: exact('hi'),
                    values: 0,
                }),
            ],
            expect: true,
        },
        {
            it: 'accepts a class instance',
            inputs: [
                new Error(),
                classShape(Error),
            ],
            expect: true,
        },
        {
            it: 'rejects the wrong class instance',
            inputs: [
                new Error(),
                classShape(HTMLElement),
            ],
            expect: false,
        },
        {
            it: 'rejects invalid indexedKeys subject values',
            inputs: [
                {hi: 'hi'},
                indexedKeys({
                    keys: '',
                    values: 0,
                }),
            ],
            expect: false,
        },
    ]);
});

describe(getShapeSpecifier.name, () => {
    itCases(getShapeSpecifier, [
        {
            it: 'errors if no parts property',
            input: (() => {
                const orResult: any = or('');

                delete orResult.parts;

                return orResult;
            })(),
            throws: Error,
        },
        {
            it: 'errors if or parts is not an array',
            input: (() => {
                const orResult: any = or('');

                orResult.parts = {};

                return orResult;
            })(),
            throws: Error,
        },
        {
            it: 'errors if specifierType is missing',
            input: (() => {
                const orResult: any = or('');

                delete orResult.specifierType;

                return orResult;
            })(),
            throws: Error,
        },
        {
            it: 'errors if specifierType is an unexpected value',
            input: (() => {
                const orResult: any = or('');

                orResult.specifierType = '';

                return orResult;
            })(),
            throws: Error,
        },
    ]);
});

describe(or.name, () => {
    it('requires at least one input', () => {
        // @ts-expect-error
        or();
        or('one input is okay');
        or('multiple', 'inputs', 'are okay');
    });
});

describe(enumShape.name, () => {
    it('only allows one input', () => {
        // @ts-expect-error
        enumShape();
        // @ts-expect-error
        enumShape('input must be an object');
        enumShape(TestEnum);
        enumShape({objectIs: 'okay too'});
        // @ts-expect-error
        enumShape(TestEnum, {multipleEnums: 'is not okay'});
    });
});

describe(unknownShape.name, () => {
    it('optionally allows a single input', () => {
        // omitting inputs entirely is allowed
        unknownShape();
        unknownShape('single input is allowed');
        // any input is allowed
        unknownShape({});
        // @ts-expect-error: multiple inputs are not allowed
        unknownShape('multiple', 'are not allowed either');
    });
});

describe(classShape.name, () => {
    it('requires a constructor input', () => {
        // @ts-expect-error: a string instance is not a constructor
        classShape('hi');
        // @ts-expect-error an object is not a constructor
        classShape({});
        // @ts-expect-error a function is not a constructor
        classShape(() => {});

        classShape(Error);
        classShape(HTMLElement);
    });
});

describe(and.name, () => {
    it('requires at least one input', () => {
        // @ts-expect-error
        and();
        and('one input is okay');
        and('multiple', 'inputs', 'are okay');
    });
});

describe(exact.name, () => {
    it('requires only one input', () => {
        // @ts-expect-error
        exact();
        exact('one input is okay');
        exact('multiple', 'inputs', 'are okay');
    });
});
