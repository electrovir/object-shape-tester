import {itCases} from '@augment-vir/browser-testing';
import {assertInstanceOf} from 'run-time-assertions';
import {DefaultValueConstructionError} from '../errors/default-value-construction.error';
import {assertValidShape} from '../verify-shape/verify-shape';
import {defineShape} from './define-shape';
import {classShape, enumShape, exact, indexedKeys, unknownShape} from './shape-specifiers';
import {shapeToDefaultValue} from './shape-to-default-value';

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
            throws: DefaultValueConstructionError,
        },
    ]);

    it('creates class default values', () => {
        const myShape = defineShape(classShape(Error));
        assertInstanceOf(myShape.defaultValue, Error);
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
