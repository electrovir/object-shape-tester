import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {assertValidShape} from '../verify-shape/verify-shape.js';
import {defineShape} from './define-shape.js';
import {and, classShape, exact, or, unknownShape} from './shape-specifiers.js';

describe(defineShape.name, () => {
    const exampleShape = defineShape({
        helloThere: 'hi',
    });

    type MyShape = typeof exampleShape.runtimeType;

    it('creates a simple shape object with correct type', () => {
        assert.tsType<(typeof exampleShape)['runtimeType']>().equals<{
            helloThere: string;
        }>();
        assert.tsType(exampleShape.shape).equals({helloThere: 'hi'});
        assert.tsType(exampleShape.shape).equals<{helloThere: string}>();
    });

    it('converts shape specifiers', () => {
        assert.tsType<(typeof exampleShape)['runtimeType']>().equals<{
            helloThere: string;
        }>();
        assert.tsType(exampleShape.shape).equals({helloThere: 'hi'});
        assert.tsType(exampleShape.shape).equals<{helloThere: string}>();
    });

    it('throws an error if runtimeType is accessed as a value', () => {
        assert.throws(() => {
            exampleShape.runtimeType;
        });
    });

    it('produces run time types from the shape definition', () => {
        const myShapeAssignment: MyShape = {
            helloThere: '',
        };

        const shapeWithExact = defineShape({exactProp: exact('derp')});
        type MyExact = typeof shapeWithExact.runtimeType;
        const myExactAssignment: MyExact = {
            exactProp: 'derp',
        };
        const myBadExactAssignment: MyExact = {
            // @ts-expect-error: intentionally wrong value
            exactProp: 'four',
        };
    });

    it('works with bare specifiers', () => {
        const myUnknown = defineShape(unknownShape());
        const myInstance: (typeof myUnknown)['runtimeType'] = myUnknown.defaultValue;

        assert.tsType(myInstance).equals<unknown>();

        const myNestedShape = defineShape({
            nested: myUnknown,
        });
        const myNestedInstance: (typeof myNestedShape)['runtimeType'] = myNestedShape.defaultValue;
        assert.tsType(myNestedInstance).equals<{nested: unknown}>();
    });

    it('works with complex nested shapes', () => {
        const myShape = defineShape({
            a: exact({
                what: 'who',
            }),
            b: or(0, ''),
            c: or(0, exact('hello there')),
        });

        const myNestedShape = defineShape({
            nested: or(myShape, 0),
        });
        const myNestedInstance: (typeof myNestedShape)['runtimeType'] = myNestedShape.defaultValue;
        assert.tsType(myNestedInstance).equals<{
            nested:
                | number
                | {
                      a: {
                          what: 'who';
                      };
                      b: number | string;
                      c: number | 'hello there';
                  };
        }>();
    });

    it('works with nested exact specifiers', () => {
        const myShape = defineShape({
            a: exact({
                what: 'who',
            }),
            b: or(0, exact('hello there')),
            c: or(0, exact('hello there')),
        });

        assert.tsType<(typeof myShape)['runtimeType']>().equals<{
            a: {what: 'who'};
            b: number | 'hello there';
            c: number | 'hello there';
        }>();
    });

    it('expands nested shape types', () => {
        const timezoneShape = defineShape({
            _isTimezone: exact(true),
            /** The IANA name of the timezone */
            ianaName: 'utc',
        });

        const dateOnlyUnitsShape = defineShape({
            /**
             * The full, four digit year.
             *
             * @example 2023;
             */
            year: 0,
            /** A month of the year: 1-12 */
            month: 0,
            /** A day of the month: 1-31 depending on the month */
            day: 0,
        });

        const fullDateShape = defineShape(
            and(dateOnlyUnitsShape, {
                /**
                 * The unix timestamp for the accompanying date and time units with the accompanying
                 * timezone.
                 */
                timestamp: 0,
                /** The timezone which the accompanying date units are meant to be expressed in. */
                timezone: timezoneShape,
            }),
        );

        const fullDate: (typeof fullDateShape)['runtimeType'] = {
            day: 0,
            month: 0,
            timestamp: 0,
            year: 0,
            timezone: {
                _isTimezone: true,
                ianaName: 'anything',
            },
        };
    });

    it('preserves const assignments', () => {
        const shapeA = defineShape({
            first: 'a',
            second: 'b',
            third: 'c' as const,
        });
        assert.tsType<typeof shapeA.runtimeType>().equals<{
            first: string;
            second: string;
            third: 'c';
        }>();
    });

    it('constructs class shapes', () => {
        const shapeA = defineShape({
            first: 'a',
            second: 'b',
            myClass: classShape(Error),
        });
        assert.tsType<typeof shapeA.runtimeType>().equals<{
            first: string;
            second: string;
            myClass: Error;
        }>();
        const defaultValue = shapeA.defaultValue;
        assert.deepEquals(defaultValue, {
            first: 'a',
            second: 'b',
            myClass: defaultValue.myClass,
        });

        assert.instanceOf(defaultValue.myClass, Error);
    });

    it('allows a shape inside of an array', () => {
        const shapeA = defineShape(
            {
                first: 'a',
                second: 'b',
                third: 'c' as const,
            },
            true,
        );
        const shapeB = defineShape(
            {
                one: [shapeA],
                two: '',
            },
            true,
        );
        assertValidShape(shapeB.defaultValue, shapeB);
    });

    it('allows function properties', () => {
        const shapeWithMethod = defineShape({
            myData: 'a',
            myMethod: (input1: string, input2: number): string => {
                return [
                    input1,
                    input2,
                ].join(': ');
            },
        });
        assert.tsType<typeof shapeWithMethod.runtimeType>().equals<{
            myData: string;
            myMethod: (a: string, b: number) => string;
        }>();
    });
});
