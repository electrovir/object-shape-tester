import {defineShape} from './define-shape/define-shape';
import {exact} from './define-shape/shape-specifiers';
import {isValidShape} from './test-shape/verify-shape';
console.log('yo');

const sharedRegExp = /shared/;

console.log(
    isValidShape(
        {
            a: 'what',
            b: 4,
            c: sharedRegExp,
        },
        defineShape({
            a: '',
            b: 0,
            c: exact(sharedRegExp),
        }),
    ),
);
