module.exports = {
    testPathIgnorePatterns: ['/node_modules/'],
    testMatch: ['**/src/**/*.spec.js'],
    verbose: true,
    testEnvironment: 'jsdom',
    testURL: 'http://localhost/',
    transform: {
        '\\.[jt]sx?$': 'babel-jest'
    }
};
