import type {IConfiguration} from 'dependency-cruiser';
import {generateDepCruiserConfig} from 'virmator/dist/compiled-base-configs/base-dep-cruiser.config';

const baseConfig = generateDepCruiserConfig({
    fileExceptions: {
        // enter file exceptions by rule name here
        'no-orphans': {
            from: [
                'src/index.ts',
                /** Only referenced by the index.html file. */
                'src/web-playground.test-helper.ts',
            ],
        },
    },
    omitRules: [
        // enter rule names here to omit
    ],
});

const depCruiserConfig: IConfiguration = {
    ...baseConfig,
};

module.exports = depCruiserConfig;
