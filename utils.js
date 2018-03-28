const gitSync = require('simple-git')
const github = require('octonode')
const rsync = require('rsyncwrapper')

const config = require('./config')

const GithubClient = github.client(config.GITHUB_TOKEN)

// I am using the un-promised version here because 'commit' and 'reset'
// methods are not implemented yet in the promised version of it.
exports.commitAndPushChanges = (directory, filesToAdd) => {
  return new Promise((resolve, reject) => {
    gitSync(directory)
      .addConfig('user.name', config.USER)
      .addConfig('user.email', config.EMAIL)
      .checkout(config.BRANCH_NAME)
      .add(filesToAdd)
      .commit(config.COMMIT_MESSAGE)
      .push(['--force', 'origin', config.BRANCH_NAME], (err) => {
        err ? reject(err) : resolve()
      })
  })
}

exports.checkoutAndResetHard = (directory) => {
  return new Promise((resolve) => {
    gitSync(directory)
      .checkout(config.BRANCH_NAME)
      .fetch(['--all'])
      .reset(['--hard', 'origin/master'], (err) => {
        err ? reject(err) : resolve()
      })
  })
}

exports.isPRAlreadyCreated = (repo) => {
  return new Promise((resolve, reject) => {
    GithubClient.repo(`${config.USER}/${repo}`).prs((err, pullRequests) => {
      if (err) {
        return reject(err)
      }

      const prAlreadyCreated = !!pullRequests.find((pr) => pr.title === config.PULL_REQUEST_NAME)
      
      resolve(prAlreadyCreated)
    })
  })
}

exports.createPullRequest = (repoName) => {
  console.log('Creating PR...')
  return new Promise((resolve, reject) => {
    GithubClient.repo(`${config.USER}/${repoName}`).pr({
      title: config.PULL_REQUEST_NAME,
      body: config.PULL_REQUEST_BODY,
      head: config.BRANCH_NAME,
      base: 'master'
    }, (err, data) => err ? reject(err) : resolve(data))
  })
}

exports.copyWithRsync = ({ src, dest }) => {
  return new Promise((resolve, reject) => {
    rsync(
      {
        src,
        dest,
        recursive: true,
        exclude: config.EXCLUDED_FILES
      },
      (error, stdout, stderr, cmd) => {
        error ? reject(error) : resolve({ src, dest })
      }
    )
  })
}