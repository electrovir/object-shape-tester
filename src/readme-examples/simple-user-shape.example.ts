import {defineShape, isValidShape} from '../index.js';

const userShapeDefinition = defineShape({
    name: 'empty name',
    id: 0,
});

export type User = typeof userShapeDefinition.runtimeType;

export const emptyUser = userShapeDefinition.defaultValue;

export function isUser(input: unknown): input is User {
    // you don't NEED to wrap isValidShape in a type guard as it is already a type guard itself
    return isValidShape(input, userShapeDefinition);
}

const myUser: User = {
    name: 'my name',
    id: 1000,
};
