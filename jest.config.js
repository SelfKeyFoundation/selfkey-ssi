module.exports = {
    testPathIgnorePatterns: ['/node_modules/'],
    testMatch: ['**/src/**/*.spec.[jt]s?(x)'],
    verbose: true,
    testEnvironment: 'node',
    testURL: 'http://localhost/',
    transform: {
        '\\.[jt]sx?$': 'babel-jest'
    }
};
