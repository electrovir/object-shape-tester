import {Type} from '@sinclair/typebox';

const derp = Type.Object(
    {
        a: Type.Number({
            default: 45,
        }),
        b: Type.String({
            default: 'hi',
        }),
    },
    {
        default: {
            a: 45,
            b: 'hi',
        },
    },
);

console.log(derp.default);
