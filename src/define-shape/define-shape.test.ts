import {assert} from '@open-wc/testing';
import {assertTypeOf} from 'run-time-assertions';
import {assertValidShape} from '../verify-shape/verify-shape';
import {defineShape} from './define-shape';
import {and, exact, or, unknownShape} from './shape-specifiers';

describe(defineShape.name, () => {
    const exampleShape = defineShape({
        helloThere: 'hi',
    });

    type MyShape = typeof exampleShape.runTimeType;

    it('creates a simple shape object with correct type', () => {
        assertTypeOf<(typeof exampleShape)['runTimeType']>().toEqualTypeOf<{
            helloThere: string;
        }>();
        assertTypeOf(exampleShape.shape).toEqualTypeOf({helloThere: 'hi'});
        assertTypeOf(exampleShape.shape).toEqualTypeOf<{helloThere: string}>();
    });

    it('converts shape specifiers', () => {
        assertTypeOf<(typeof exampleShape)['runTimeType']>().toEqualTypeOf<{
            helloThere: string;
        }>();
        assertTypeOf(exampleShape.shape).toEqualTypeOf({helloThere: 'hi'});
        assertTypeOf(exampleShape.shape).toEqualTypeOf<{helloThere: string}>();
    });

    it('throws an error if runtimeType is accessed as a value', () => {
        assert.throws(() => {
            exampleShape.runTimeType;
        });
    });

    it('produces run time types from the shape definition', () => {
        const myShapeAssignment: MyShape = {
            helloThere: '',
        };

        const shapeWithExact = defineShape({exactProp: exact('derp')});
        type MyExact = typeof shapeWithExact.runTimeType;
        const myExactAssignment: MyExact = {
            exactProp: 'derp',
        };
        const myBadExactAssignment: MyExact = {
            // @ts-expect-error
            exactProp: 'four',
        };
    });

    it('works with bare specifiers', () => {
        const myUnknown = defineShape(unknownShape());
        const myInstance: (typeof myUnknown)['runTimeType'] = myUnknown.defaultValue;

        assertTypeOf(myInstance).toEqualTypeOf<unknown>();

        const myNestedShape = defineShape({
            nested: myUnknown,
        });
        const myNestedInstance: (typeof myNestedShape)['runTimeType'] = myNestedShape.defaultValue;
        assertTypeOf(myNestedInstance).toEqualTypeOf<{nested: unknown}>();
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
        const myNestedInstance: (typeof myNestedShape)['runTimeType'] = myNestedShape.defaultValue;
        assertTypeOf(myNestedInstance).toEqualTypeOf<{
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

        assertTypeOf<(typeof myShape)['runTimeType']>().toEqualTypeOf<{
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
             * @example
             *     2023;
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

        const fullDate: (typeof fullDateShape)['runTimeType'] = {
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
        assertTypeOf<typeof shapeA.runTimeType>().toEqualTypeOf<{
            first: string;
            second: string;
            third: 'c';
        }>();
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
        console.log(shapeB.defaultValue);
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
        assertTypeOf<typeof shapeWithMethod.runTimeType>().toEqualTypeOf<{
            myData: string;
            myMethod: (a: string, b: number) => string;
        }>();
    });
});
