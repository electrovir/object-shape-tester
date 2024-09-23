import {assert} from '@augment-vir/assert';
import {describe, it, itCases} from '@augment-vir/test';
import {DefaultValueConstructionError} from '../errors/default-value-construction.error.js';
import {assertValidShape} from '../verify-shape/verify-shape.js';
import {defineShape} from './define-shape.js';
import {classShape, enumShape, exact, indexedKeys, unknownShape} from './shape-specifiers.js';
import {shapeToDefaultValue} from './shape-to-default-value.js';

enum TestEnum {
    First = 'first',
    Second = 'second',
    Third = 'third',
}

describe(shapeToDefaultValue.name, () => {
    itCases(shapeToDefaultValue, [
        {
            it: 'allows defining a default value for unknown',
            inputs: [
                unknownShape('my default value'),
            ],
            expect: 'my default value',
        },
        {
            it: 'defaults unknown shape to empty object',
            inputs: [
                unknownShape(),
            ],
            expect: {},
        },
        {
            it: 'defaults indexed keys shape to empty object',
            inputs: [
                indexedKeys({
                    keys: exact('hi'),
                    values: {
                        hi: '',
                    },
                    required: false,
                }),
            ],
            expect: {},
        },
        {
            it: 'fails to call a constructor that cannot be called',
            inputs: [
                classShape(HTMLElement),
            ],
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
