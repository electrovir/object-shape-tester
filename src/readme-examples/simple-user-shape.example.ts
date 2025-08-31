import {assertValidShape, defineShape} from '../index.js';

const userShape = defineShape({
    /**
     * This value is simplified to just a `string` required type, with `'empty name'` as the default
     * value.
     */
    name: 'empty name',
    /** This value is simplified to just a `number` required type, with `0` as the default value. */
    id: 0,
});

/** Access the TypeScript type with `.runtimeType`. */
export type User = typeof userShape.runtimeType;

/**
 * Access the default value with `.default`. For this shape, the default value is:
 *
 * `{name: 'empty name', id: 0}`
 */
export const emptyUser = userShape.default;

const myUser: User = {
    name: 'my name',
    id: 1000,
};

assertValidShape(myUser, userShape);
