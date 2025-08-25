import {assert} from '@augment-vir/assert';
import {describe, it, itCases} from '@augment-vir/test';
import {DefaultValueConstructionError} from '../errors/default-value-construction.error.js';
import {assertValidShape} from '../old/verify-shape.js';
import {defineShape} from './define-shape.js';
import {
    classShape,
    enumShape,
    exact,
    indexedKeys,
    numericRange,
    optional,
    or,
    tupleShape,
    unknownShape,
} from './shape-specifiers.js';
import {shapeToDefaultValue} from './shape-to-default-value.js';

enum TestEnum {
    First = 'first',
    Second = 'second',
    Third = 'third',
}

describe(shapeToDefaultValue.name, () => {
    itCases(shapeToDefaultValue, [
        {
            it: 'defaults an optional property to its inputs',
            input: optional('hi'),
            expect: 'hi',
        },
        {
            it: 'defaults a tuple to its inputs',
            input: tupleShape('', -1, exact('hi')),
            expect: [
                '',
                -1,
                'hi',
            ],
        },
        {
            it: 'allows a custom enumShape default value',
            input: enumShape(TestEnum, TestEnum.Second),
            expect: TestEnum.Second,
        },
        {
            it: 'uses a default enum value',
            input: enumShape(TestEnum),
            expect: TestEnum.First,
        },
        {
            it: 'allows defining a default value for unknown',
            input: unknownShape('my default value'),
            expect: 'my default value',
        },
        {
            it: 'defaults unknown shape to empty object',
            input: unknownShape(),
            expect: {},
        },
        {
            it: 'defaults numeric range to the first number',
            input: numericRange(1, 10),
            expect: 1,
        },
        {
            it: 'defaults indexed keys shape to empty object',
            input: indexedKeys({
                keys: exact('hi'),
                values: {
                    hi: '',
                },
                required: false,
            }),
            expect: {},
        },
        {
            it: 'unwraps optional',
            input: optional(or([''], '')),
            expect: [''],
        },
        {
            it: 'fails to call a constructor that cannot be called',
            input: classShape(HTMLElement),
            throws: {
                matchConstructor: DefaultValueConstructionError,
            },
        },
    ]);

    it('creates class default values', () => {
        const myShape = defineShape(classShape(Error));
        assert.instanceOf(myShape.defaultValue, Error);
    });

    it('creates a valid default value for required indexed keys', () => {
        const exampleShape = defineShape(
            indexedKeys({
                keys: enumShape(TestEnum),
                values: 42,
                required: true,
            }),
        );

        assertValidShape(exampleShape.defaultValue, exampleShape);
    });
});
