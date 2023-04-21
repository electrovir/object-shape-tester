import {assertTypeOf, itCases} from '@augment-vir/browser-testing';
import {defineShape} from './define-shape';
import {and, exact, getShapeSpecifier, or} from './shape-specifiers';

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
            it: 'errors if parts is not an array',
            input: (() => {
                const orResult: any = or('');

                orResult.parts = {};

                return orResult;
            })(),
            throws: Error,
        },
        {
            it: 'errors if parts is empty',
            input: (() => {
                const orResult: any = or('');

                orResult.parts = [];

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
