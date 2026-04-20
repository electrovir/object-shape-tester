import {
    assertValidShape,
    defineShape,
    enumShape,
    exactShape,
    intersectShape,
    unionShape,
    unknownShape,
} from '../index.js';

enum AuthLevel {
    Basic = 'basic',
    Admin = 'admin',
}

const userShape = defineShape({
    firstName: 'first',
    middleInitial: unionShape('M', undefined),
    lastName: 'last',
    id: 0,
    tags: intersectShape(
        {
            userTags: [''],
        },
        {
            creatorTags: [''],
        },
    ),
    primaryColor: unionShape(exactShape('red'), exactShape('green'), exactShape('blue')),
    authLevel: enumShape(AuthLevel),
    extraDetails: unknownShape(),
});

export type ComplexUser = typeof userShape.runtimeType;

export const emptyComplexUser = userShape.default;

const myUser: ComplexUser = {
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

assertValidShape(myUser, userShape);
