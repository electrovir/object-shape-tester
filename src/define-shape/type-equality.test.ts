import {describe, itCases} from '@augment-vir/test';
import {haveEqualTypes} from './type-equality.js';

describe(haveEqualTypes.name, () => {
    itCases(haveEqualTypes, [
        {
            it: 'works on strings',
            input: {
                subject: 'a',
                shape: 'b',
            },
            expect: true,
        },
        {
            it: 'works on numbers',
            input: {
                subject: -1,
                shape: 1,
            },
            expect: true,
        },
        {
            it: 'works on RegExps',
            input: {
                subject: /a/,
                shape: new RegExp('[abc]'),
            },
            expect: true,
        },
        {
            it: 'rejects objects of different constructors',
            input: {
                subject: {},
                shape: new RegExp('[abcd]'),
            },
            expect: false,
        },
        {
            it: 'works will the null object prototype',
            only: true,
            input: {
                subject: Object.assign(Object.create(null), {some: 'value'}),
                shape: {},
            },
            expect: true,
        },
    ]);
});
