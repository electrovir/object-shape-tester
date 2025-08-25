import {assert} from '@augment-vir/assert';
import {describe, it, itCases} from '@augment-vir/test';
import {Kind, type Static, Type} from '@sinclair/typebox';
import {defineShape, isSchema, shapeIdentifier, type ShapeInitSchema} from './shape.js';

describe(defineShape.name, () => {
    it('short circuits if given another shape', () => {
        const originalShape = {
            [shapeIdentifier]: true,
            something: 'hi',
        };

        const newShape = defineShape(originalShape);
        assert.strictEquals(newShape as any, originalShape);
    });
    it('accepts a schema', () => {
        const myShape = defineShape(Type.Number({default: 4}));

        assert.tsType<typeof myShape.runtimeType>().equals<number>();
        assert.strictEquals(myShape.default, 4);
    });
});

describe(isSchema.name, () => {
    itCases(isSchema, [
        {
            it: 'rejects a number',
            input: 4,
            expect: false,
        },
        {
            it: 'rejects a string',
            input: 'hi',
            expect: false,
        },
        {
            it: 'rejects undefined',
            input: undefined,
            expect: false,
        },
        {
            it: 'rejects null',
            input: null,
            expect: false,
        },
        {
            it: 'rejects null',
            input: null,
            expect: false,
        },
        {
            it: 'rejects an empty object',
            input: {},
            expect: false,
        },
        {
            it: 'accepts TNumber',
            input: Type.Number(),
            expect: true,
        },
        {
            it: 'accepts TString',
            input: Type.String(),
            expect: true,
        },
        {
            it: 'accepts TObject',
            input: Type.Object({a: Type.Number()}),
            expect: true,
        },
        {
            it: 'accepts TArray',
            input: Type.Array(Type.String()),
            expect: true,
        },
        {
            it: 'accepts TTuple',
            input: Type.Tuple([
                Type.String(),
                Type.Number(),
            ]),
            expect: true,
        },
        {
            it: 'accepts TUnion',
            input: Type.Union([
                Type.String(),
                Type.Number(),
            ]),
            expect: true,
        },
        {
            it: 'accepts TLiteral',
            input: Type.Literal('x'),
            expect: true,
        },
        {
            it: 'accepts TRecord',
            input: Type.Record(Type.String(), Type.Number()),
            expect: true,
        },
        {
            it: 'accepts TOptional',
            input: Type.Optional(Type.String()),
            expect: true,
        },
        {
            it: 'accepts a crafted object with [Kind] symbol',
            input: {[Kind]: 'Fake' as any},
            expect: true,
        },
        {
            it: 'rejects an array',
            input: [],
            expect: false,
        },
        {
            it: 'rejects a function',
            input() {
                /* noop */
            },
            expect: false,
        },
        {
            it: 'rejects a symbol',
            input: Symbol('s'),
            expect: false,
        },
        {
            it: 'rejects a bigint',
            input: 10n,
            expect: false,
        },
        {
            it: 'rejects a Date',
            input: new Date(),
            expect: false,
        },
        {
            it: 'rejects a RegExp',
            input: /x/,
            expect: false,
        },
        {
            it: 'rejects a Map',
            input: new Map(),
            expect: false,
        },
        {
            it: 'rejects a Set',
            input: new Set(),
            expect: false,
        },
        {
            it: 'rejects a Promise',
            input: Promise.resolve(1),
            expect: false,
        },
        {
            it: 'rejects a class instance',
            input: new (class Foo {
                public value = 1;
            })(),
            expect: false,
        },
        {
            it: 'rejects a prototype-less object',
            input: Object.create(null),
            expect: false,
        },
        {
            it: 'rejects a typed array',
            input: new Uint8Array(2),
            expect: false,
        },
    ]);
});

describe('ShapeInitSchema', () => {
    it('maintains primitives', () => {
        assert.tsType<Static<ShapeInitSchema<''>>>().equals<''>();
        assert.tsType<Static<ShapeInitSchema<string>>>().equals<string>();

        assert.tsType<Static<ShapeInitSchema<number>>>().equals<number>();
        assert.tsType<Static<ShapeInitSchema<42>>>().equals<42>();

        assert.tsType<Static<ShapeInitSchema<undefined>>>().equals<undefined>();
        assert.tsType<Static<ShapeInitSchema<null>>>().equals<null>();

        assert.tsType<Static<ShapeInitSchema<bigint>>>().equals<bigint>();
        assert.tsType<Static<ShapeInitSchema<42n>>>().equals<42n>();

        assert.tsType<Static<ShapeInitSchema<boolean>>>().equals<boolean>();
        assert.tsType<Static<ShapeInitSchema<false>>>().equals<false>();

        const testSymbol = Symbol('test');

        assert.tsType<Static<ShapeInitSchema<symbol>>>().equals<symbol>();
        assert.tsType<Static<ShapeInitSchema<typeof testSymbol>>>().equals<typeof testSymbol>();
    });

    it('maintains array values', () => {
        assert.tsType<Static<ShapeInitSchema<(string | number)[]>>>().equals<(string | number)[]>();
        assert.tsType<Static<ShapeInitSchema<[string, number]>>>().equals<(string | number)[]>();
    });

    it('maintains object values', () => {
        assert
            .tsType<Static<ShapeInitSchema<{[key in string]: number}>>>()
            .equals<{[key in string]: number}>();
        assert
            .tsType<
                Static<
                    ShapeInitSchema<{
                        a: number;
                        b: string;
                    }>
                >
            >()
            .equals<{
                a: number;
                b: string;
            }>();
    });
});
