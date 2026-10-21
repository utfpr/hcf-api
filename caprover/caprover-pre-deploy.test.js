'use strict'

const { afterEach, before, beforeEach, describe, it, mock } = require('node:test')
const assert = require('node:assert/strict')
const Module = require('node:module')

const dockerUpdateObject = {
  TaskTemplate: {
    ContainerSpec: {
      Image: 'img:sha',
      Env: ['PG_HOST=10.0.0.1', 'PG_PASSWORD=p$ass']
    }
  }
}

let DockerOptions
let createContainer
let container
let preDeployFunction

const originalLoad = Module._load

function MockDocker(options) {
  DockerOptions = options
  this.createContainer = createContainer
}

before(() => {
  Module._load = function load(request, parent, isMain) {
    if (request === 'dockerode') {
      return MockDocker
    }
    return originalLoad.call(this, request, parent, isMain)
  }

  preDeployFunction = require('./caprover-pre-deploy.js')
})

beforeEach(() => {
  mock.method(console, 'log', () => {})
})

afterEach(() => {
  mock.reset()
})

function stubContainer({ statusCode = 0, logs = Buffer.from('applied\n'), removeError } = {}) {
  container = {
    start: mock.fn(async () => {}),
    wait: mock.fn(async () => ({ StatusCode: statusCode })),
    logs: mock.fn(async () => logs),
    remove: mock.fn(async () => {
      if (removeError) {
        throw removeError
      }
    })
  }
  createContainer = mock.fn(async () => container)
}

describe('caprover-pre-deploy', () => {
  it('rejects when the new image is missing', async () => {
    stubContainer()

    await assert.rejects(
      () => preDeployFunction({}, {}),
      { message: 'pre-deploy: missing TaskTemplate.ContainerSpec.Image' }
    )
    assert.strictEqual(createContainer.mock.callCount(), 0)
  })

  it('runs migration:apply on the new image with Env as an array', async () => {
    stubContainer()

    const result = await preDeployFunction({}, dockerUpdateObject)

    assert.deepStrictEqual(DockerOptions, { socketPath: '/var/run/docker.sock' })
    assert.strictEqual(createContainer.mock.callCount(), 1)
    assert.deepStrictEqual(createContainer.mock.calls[0].arguments[0], {
      Image: 'img:sha',
      Cmd: ['node', 'dist/database/cli.js', 'migration:apply'],
      Env: ['PG_HOST=10.0.0.1', 'PG_PASSWORD=p$ass']
    })
    assert.strictEqual(container.start.mock.callCount(), 1)
    assert.strictEqual(container.wait.mock.callCount(), 1)
    assert.strictEqual(container.remove.mock.callCount(), 1)
    assert.deepStrictEqual(container.remove.mock.calls[0].arguments[0], { force: true })
    assert.strictEqual(result, dockerUpdateObject)
  })

  it('defaults Env to an empty array when ContainerSpec has none', async () => {
    stubContainer()

    await preDeployFunction({}, {
      TaskTemplate: {
        ContainerSpec: { Image: 'img:sha' }
      }
    })

    assert.deepStrictEqual(createContainer.mock.calls[0].arguments[0].Env, [])
  })

  it('rejects when migration:apply exits non-zero and still removes the container', async () => {
    stubContainer({ statusCode: 2 })

    await assert.rejects(
      () => preDeployFunction({}, dockerUpdateObject),
      { message: 'migration:apply exited with status 2' }
    )
    assert.strictEqual(container.remove.mock.callCount(), 1)
  })

  it('logs a remove failure without hiding a successful apply', async () => {
    const removeError = new Error('already gone')
    stubContainer({ removeError })
    const error = mock.method(console, 'error', () => {})

    const result = await preDeployFunction({}, dockerUpdateObject)

    assert.strictEqual(result, dockerUpdateObject)
    assert.strictEqual(error.mock.callCount(), 1)
    assert.strictEqual(
      error.mock.calls[0].arguments[0],
      'pre-deploy: failed to remove migration container'
    )
    assert.strictEqual(error.mock.calls[0].arguments[1], removeError)
  })

  it('prints container logs as utf8', async () => {
    stubContainer({ logs: Buffer.from('No pending migrations to apply') })
    const log = mock.method(console, 'log', () => {})

    await preDeployFunction({}, dockerUpdateObject)

    assert.strictEqual(log.mock.callCount(), 1)
    assert.strictEqual(log.mock.calls[0].arguments[0], 'No pending migrations to apply')
  })
})
