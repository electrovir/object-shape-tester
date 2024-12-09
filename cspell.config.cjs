const {baseConfig} = require('@virmator/spellcheck/configs/cspell.config.base.cjs');

module.exports = {
    ...baseConfig,
    ignorePaths: [
        ...baseConfig.ignorePaths,
        'src/performance/big-object.mock.ts',
    ],
    words: [
        ...baseConfig.words,
    ],
};
