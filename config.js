module.exports = {
  // Github account information
  // USER and PASS might need to be uri-encoded if there are special characters.
  USER: process.env.GITHUB_USERNAME,
  PASS: encodeURIComponent(process.env.GITHUB_PASSWORD),
  EMAIL: process.env.GITHUB_EMAIL,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,

  // Commit and PR info
  BRANCH_NAME: 'syncing/node-boilerplate',
  COMMIT_MESSAGE: 'Syncing from nodejs-boilerplate',
  PULL_REQUEST_NAME: 'Syncing from nodejs-boilerplate',
  PULL_REQUEST_BODY: 'Automatic pull request created as the NodeJS boilerplate was updated.',

  // Files that should be excluded when syncing repositories
  EXCLUDED_FILES: ['README.md', 'yarn.lock', '.install', 'package.json'],

  // Directory where projects are cloned
  TMP_DIR: '/tmp'
}