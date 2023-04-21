import {defineShape} from './define-shape/define-shape';
import {and} from './define-shape/shape-specifiers';
import {isValidShape} from './verify-shape/verify-shape';
console.log('yo');

const sharedRegExp = /shared/;

console.log(
    isValidShape(
        {
            a: 'what',
            get b(): string {
                throw new Error('failed to get b');
            },
            c: {a: 0, c: ''},
        },
        defineShape({
            a: 'what',
            b: and('', {
                get b(): string {
                    throw new Error('failed to get b');
                },
            }),
            c: and({a: 0}, {b: ''}),
        }),
    ),
);
