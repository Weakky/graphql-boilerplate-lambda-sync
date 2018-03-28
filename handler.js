'use strict'

const crypto = require('crypto');

const repositories = require('./repositories')
const syncing = require('./syncing')

const syncRepositories = () => {
  // Install git and set the process env path  
  return require('lambda-git')()
    // Clone all the boilerplates that are not cloned yet
    .then(syncing.cloneRepos)
    // Create new branch, or reset --hard on master
    .then(syncing.cleanRepos)
    // Copy node-boilerplate to all the other boilerplates
    .then(syncing.syncRepos)
    // Perform a git status to find which boilerplates needs to be sent a PR
    .then(syncing.retrieveDiffs)
    //Make sure their are diffs, then push and create PR's to the different projects
    .then(syncing.flush)
}


function signRequestBody(key, body) {
  return `sha1=${crypto.createHmac('sha1', key).update(body, 'utf-8').digest('hex')}`;
}

module.exports.githubWebhookListener = (event, context, callback) => {
  var errMsg; // eslint-disable-line
  const token = process.env.GITHUB_WEBHOOK_SECRET;
  const headers = event.headers;
  const sig = headers['X-Hub-Signature'];
  const githubEvent = headers['X-GitHub-Event'];
  const id = headers['X-GitHub-Delivery'];
  const calculatedSig = signRequestBody(token, event.body);

  if (typeof token !== 'string') {
    return callback(null, {
      statusCode: 401,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Must provide a \'GITHUB_WEBHOOK_SECRET\' env variable',
    });
  }

  if (!sig) {
    return callback(null, {
      statusCode: 401,
      headers: { 'Content-Type': 'text/plain' },
      body: 'No X-Hub-Signature found on request',
    });
  }

  if (!githubEvent) {
    return callback(null, {
      statusCode: 422,
      headers: { 'Content-Type': 'text/plain' },
      body: 'No X-Github-Event found on request',
    });
  }

  if (!id) {
    return callback(null, {
      statusCode: 401,
      headers: { 'Content-Type': 'text/plain' },
      body: 'No X-Github-Delivery found on request',
    });
  }

  if (sig !== calculatedSig) {
    return callback(null, {
      statusCode: 401,
      headers: { 'Content-Type': 'text/plain' },
      body: 'X-Hub-Signature incorrect. Github webhook token doesn\'t match',
    });
  }

  syncRepositories()
    .then((updatedRepos) => {
      const filteredUpdatedRepos = repositories.REPOS_TO_SYNC
        .filter((repository, i) => updatedRepos[i])
        .map((repository, i) => repository.name)

        callback(null, {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updatedRepos: filteredUpdatedRepos })
        })
    })
    .catch((err) => callback(null, {
      statusCode: 400,
      headers: { 'Content-Type': 'text/plain' },
      body: `Something failed. ${err}`
    }))
};

