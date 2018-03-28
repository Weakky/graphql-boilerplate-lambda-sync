const fs = require('fs')
const bluebird = require('bluebird')
const git = require('simple-git/promise')
const flatMap = require('lodash.flatmap')

const config = require('./config')
const utils = require('./utils')
const repositories = require('./repositories')

exports.cloneRepos = () => {
  console.log('Cloning repos...')
  return Promise.all(
    repositories.REPOS_TO_CLONE
      .filter((repo) => !fs.existsSync(repo.directory))
      .map(({ uri, directory }) => git().clone(uri, directory))
  )
}

exports.cleanRepos = () => {
  console.log('Cleaning repos...')
  return bluebird.mapSeries(
    repositories.REPOS_TO_SYNC, (({ directory }) => {
      const gitInstance = git(directory);

      return gitInstance.branch()
        .then((branchesInfo) => {
          return Promise.resolve(!!branchesInfo.branches[(`remotes/origin/${config.BRANCH_NAME}`)])
        })
        .then((branchExist) => {
          if (!branchExist) {
            return gitInstance.checkoutBranch(config.BRANCH_NAME, 'master')
          }

          return utils.checkoutAndResetHard(directory)
        })
    })
  )
}

exports.syncRepos = () => {
  console.log('Syncing repos...')
  const dirsToCopy = flatMap(
    repositories.REPOS_TO_SYNC,
    ({ directory, availableBoilerplates }) => (
      availableBoilerplates.map(boilerplate => ({
        src: `${repositories.BASE_REPO.directory}/${boilerplate}/`,
        dest: `${directory}/${boilerplate}/server`
      })
    )
  ))

  return Promise.all(dirsToCopy.map(utils.copyWithRsync))
}

exports.retrieveDiffs = () => {
  console.log('Retrieving diffs...')
  // Using mapSeries because getting all repo statuses concurrently was failing randomly
  return bluebird.mapSeries(repositories.REPOS_TO_SYNC, (repo) => git(repo.directory).status())
}

exports.flush = (statuses) => {
  console.log('Commiting diffs and creating PR\'s...')
  return Promise.all(
    repositories.REPOS_TO_SYNC.map((repo, i) => {
      if (!statuses[i].files.length) {
        return Promise.resolve(false);
      }

      const filesToAdd = statuses[i].files.map(({ path }) => path)
      //console.log(`Updated files for: ${repo.name}\n`, filesToAdd)
      return utils.commitAndPushChanges(repo.directory, filesToAdd)
        .then(() => utils.isPRAlreadyCreated(repo.name))
        .then((isPRAlreadyCreated) => (
          isPRAlreadyCreated
            ? Promise.resolve()
            : utils.createPullRequest(repo.name)
        ))
        .then(() => Promise.resolve(true))
    })
  )
}

