import Docker from "dockerode"
import get from "object-get"
import Promise from "bluebird"
import Etcd from "node-etcd"

const { DEBUG, ETCD_HOST, REGISTER_INTERVAL } = process.env;

console.log = DEBUG === "true" ? console.log : function(){}

const etcd = new Etcd(ETCD_HOST || "etcd")
const dockerClient = new Docker({socketPath: '/var/run/docker.sock'})
const docker = Promise.promisifyAll(dockerClient, {suffix: "Async"})

syncContainers()
setInterval(syncContainers, REGISTER_INTERVAL || 5000)

function syncContainers() {
  docker.listContainersAsync({all: false})
    .map(container => Promise.promisifyAll(docker.getContainer(container.Id)))
    .map(container => container.inspectAsync())
    .map((data) => {
      const id = get(data, "Config.Hostname")
      const env = get(data, "Config.Env")
      const ipString = getEnv(env, "DOCKERCLOUD_IP_ADDRESS")
      const ip = ipString ? ipString.split("/")[0] : null
      const virtualHostsString = getEnv(env, "SERVICE_VIRTUAL_HOST")
      const virtualHosts = virtualHostsString ? virtualHostsString.split(",") : []
      const certsString = getEnv(env, "SERVICE_CERTS")
      const certs = certsString ? certsString.split(",") : []
      const tagsString = getEnv(env, "SERVICE_TAGS")
      const tags = tagsString ? tagsString.split(",") : []
      const port = getEnv(env, "SERVICE_PORT")
      const name = getEnv(env, "SERVICE_NAME")

      if (!ip) {
        return console.log(`Skipping ${data.Name}: no DOCKERCLOUD_IP_ADDRESS`)
      }

      if (!name) {
        return console.log(`Skipping ${name}: no SERVICE_NAME`)
      }

      if (!port) {
        return console.log(`Skipping ${data.Name}: no SERVICE_PORT`)
      }

      if (!virtualHosts.length) {
        return console.log(`Skipping ${data.Name}: no SERVICE_VIRTUAL_HOST`)
      }

      tags.forEach((tag) => {
        tag = tag.split(":");
        etcd.set(`services/${name}/tags/${tag[0]}`, tag[1], {ttl: 30, maxRetries: 0}, console.log)
      })

      virtualHosts.forEach((host, i) => {
        etcd.set(`services/${name}/hosts/${host}/upstream/${id}`, `${ip}:${port}`, {ttl: 30, maxRetries: 0}, console.log)

        if (certs[i]) {
          etcd.set(`services/${name}/hosts/${host}/ssl`, true, {ttl: 30, maxRetries: 0}, console.log)
          etcd.set(`services/${name}/hosts/${host}/cert`, certs[i], {ttl: 30, maxRetries: 0}, console.log)
        }
      })

      console.log(`Registering ${data.Name}`);
    })
    .catch(err => console.log("ERROR", err))
}

function getEnv(envs, key) {
  const search = new RegExp(`^${key}`)

  return envs.filter(env => search.exec(env))
    // comes in as SOME_ENV=someval
    // keep anything after the first =
    .map((env) => env.split("=").splice(1).join("="))[0]
}
