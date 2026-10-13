const Docker = require('dockerode')

function printLogs(logs) {
  if (logs == null) {
    return
  }
  if (Buffer.isBuffer(logs)) {
    console.log(logs.toString('utf8'))
    return
  }
  console.log(String(logs))
}

async function preDeployFunction(captainAppObj, dockerUpdateObject) {
  const spec = dockerUpdateObject
    && dockerUpdateObject.TaskTemplate
    && dockerUpdateObject.TaskTemplate.ContainerSpec

  if (!spec || !spec.Image) {
    throw new Error('pre-deploy: missing TaskTemplate.ContainerSpec.Image')
  }

  const docker = new Docker({ socketPath: '/var/run/docker.sock' })
  const container = await docker.createContainer({
    Image: spec.Image,
    Cmd: ['node', 'dist/database/cli.js', 'migration:apply'],
    Env: spec.Env || []
  })

  try {
    await container.start()
    const result = await container.wait()
    const logs = await container.logs({ stdout: true, stderr: true })
    printLogs(logs)

    const statusCode = result && result.StatusCode
    if (statusCode !== 0) {
      throw new Error('migration:apply exited with status ' + statusCode)
    }

    return dockerUpdateObject
  } finally {
    await container.remove({ force: true }).catch((error) => {
      console.error('pre-deploy: failed to remove migration container', error)
    })
  }
}

module.exports = preDeployFunction
