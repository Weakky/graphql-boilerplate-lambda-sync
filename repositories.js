const config = require('./config')

const buildRemoteGitRepo = (repoName) => `https://${config.USER}:${config.PASS}@github.com/${config.USER}/${repoName}`

// Base repository on which every other boilerplates are synced
const BASE_REPO = {
  uri: buildRemoteGitRepo('node-graphql-server'),
  name: 'node-graphql-server',
  directory: `${config.TMP_DIR}/node`,
}

// Repositories that are synced based on BASE_REPO
const REPOS_TO_SYNC = [
  {
    uri: buildRemoteGitRepo('react-fullstack-graphql'),
    name: 'react-fullstack-graphql',
    directory: `${config.TMP_DIR}/react`,
    availableBoilerplates: ['minimal', 'basic'],
  },
  {
    uri: buildRemoteGitRepo('vue-fullstack-graphql'),
    name: 'vue-fullstack-graphql',
    directory: `${config.TMP_DIR}/vue`,
    availableBoilerplates: ['minimal', 'basic', 'advanced'],
  },
  {
    uri: buildRemoteGitRepo('angular-fullstack-graphql'),
    name: 'angular-fullstack-graphql',
    directory: `${config.TMP_DIR}/angular`,
    availableBoilerplates: ['basic'],
  },
  /*{
    uri: buildRemoteGitRepo('react-native-fullstack-graphql'),
    name: 'react-native-fullstack-graphql',
    directory: `${config.TMP_DIR}/react-native`,
    availableBoilerplates: ['basic'],
  },*/
]

const REPOS_TO_CLONE = [BASE_REPO].concat(REPOS_TO_SYNC)

exports.BASE_REPO = BASE_REPO
exports.REPOS_TO_SYNC = REPOS_TO_SYNC
exports.REPOS_TO_CLONE = REPOS_TO_CLONE