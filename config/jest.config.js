const appRoot = require('app-root-path').path;

module.exports = {
    // Specify the root directory for Jest to look for tests
    roots: [`${appRoot}/src`],
  
    // Transform JavaScript files using Babel
    transform: {
      '^.+\\.js$': 'babel-jest',
    },
  
    // Customize the test environment
    testEnvironment: 'node',
  
    // Define the file patterns Jest should consider as tests
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.js$',
  
    // Ignore specific directories from being scanned for tests
    testPathIgnorePatterns: ['/node_modules/'],
  
    // Enable code coverage reporting
    collectCoverage: true,
  
    // Specify the directories to include for code coverage
    collectCoverageFrom: ['src/**/*.js'],
  
    // Configure the coverage report directory
    coverageDirectory: `${appRoot}/coverage`,
  
    // Setup files to run before running tests
    //setupFilesAfterEnv: [`${appRoot}/test/setup.js`],
  
    // Teardown files to run after running tests
    // teardown.js is optional based on your project requirements
    // If you don't have any teardown logic, you can omit this line
    //teardown: `${appRoot}/test/teardown.js`,
  };
  