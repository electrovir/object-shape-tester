import {defineShape} from './define-shape/define-shape';
import {or} from './define-shape/shape-specifiers';
import {isValidShape} from './verify-shape/verify-shape';

console.log(
    isValidShape(
        {
            c: null,
        },
        defineShape({
            a: undefined,
            b: or('', undefined),
            c: null,
        }),
    ),
);
