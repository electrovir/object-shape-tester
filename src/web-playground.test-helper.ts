/**
 * This file is helpful for easy in-browser debugging. Simply run `npm start` to start a web-server
 * that hosts it.
 */

import {defineShape} from './define-shape/define-shape';
import {exact, or} from './define-shape/shape-specifiers';
import {assertValidShape} from './verify-shape/verify-shape';

assertValidShape(
    {
        a: {what: 'who'},
        b: 'hello there',
        c: 4321,
    },
    defineShape({
        a: exact({
            what: 'who',
        }),
        b: or(0, exact('hello there')),
        c: or(0, exact('hello there')),
    }),
);
