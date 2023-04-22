import {and, defineShape, enumShape, exact, isValidShape, or, unknownShape} from '..';

enum AuthLevel {
    Basic = 'basic',
    Admin = 'admin',
}

const complexUserShapeDefinition = defineShape({
    firstName: 'first',
    middleInitial: or('M', undefined),
    lastName: 'last',
    id: 0,
    tags: and({userTags: ['']}, {creatorTags: ['']}),
    primaryColor: exact('red', 'green', 'blue'),
    authLevel: enumShape(AuthLevel),
    extraDetails: unknownShape(),
});

export type ComplexUser = typeof complexUserShapeDefinition.runTimeType;

export const emptyComplexUser = complexUserShapeDefinition.defaultValue;

export function isComplexUser(input: unknown): input is ComplexUser {
    // you don't NEED to wrap isValidShape in a type guard as it is already a type guard itself
    return isValidShape(input, complexUserShapeDefinition);
}

const myComplexUser: ComplexUser = {
    firstName: 'my first',
    middleInitial: undefined,
    lastName: 'last name',
    id: 1000,
    tags: {
        userTags: [],
        creatorTags: [],
    },
    primaryColor: 'blue',
    authLevel: AuthLevel.Admin,
    extraDetails: {
        whatever: 'you want',
    },
};
