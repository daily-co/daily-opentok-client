const esModules = ["@theopenweb/get-user-media-mock"].join("|");

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest/presets/js-with-ts",
  testEnvironment: "jsdom",
  collectCoverage: true,
  transformIgnorePatterns: [`./node_modules/(?!${esModules})`],
};
