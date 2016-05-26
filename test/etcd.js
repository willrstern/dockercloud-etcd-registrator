import assert from "assert"
import Etcd from "node-etcd"
import flatten from "etcd-flatten"
import syncContainers from "../src/docker-watch"

const etcd = new Etcd("etcd")

var data
describe("tests", () => {
  before((done) => {
    syncContainers().then(function() {
      // just to make sure async etcd.set`s all happen
      setTimeout(() => {
        etcd.get("services", {recursive: true}, (err, response) => {
          if (err) {
            return console.log("Error fetching services from Etcd", err)
          }
          data = flatten(response.node)
          done()
        })
      }, 100)
    })
  })

  it("should set nginx tag", () => {
    assert.equal(data["/services/web/tags/nginx"], "primary")
  })

  it("should set ssl tag", () => {
    assert.equal(data["/services/web/hosts/test.com/ssl"], "true")
  })

  it("should not set ssl tag when no cert is provided", () => {
    assert.equal(data["/services/web/hosts/test2.com/ssl"], undefined)
  })

  it("should set ssl certs when defined", () => {
    assert.equal(data["/services/web/hosts/test.com/cert"], "cert1")
    assert.equal(data["/services/web/hosts/test3.com/cert"], "cert3")
  })

  it("should not set ssl certs when not defined", () => {
    assert.equal(data["/services/web/hosts/test2.com/cert"], undefined)
  })

  it("should set 1 upstream for api", () => {
    const apiUpstreams = Object.keys(data)
      .filter(key => key.match("/services/api/hosts/api.com/upstream"))
      .map(key => data[key])

    assert.equal(apiUpstreams.length, 1)
    assert(~apiUpstreams.indexOf("123.45.67.10:3000"))
  })

  it("should set 2 upstreams for web", () => {
    const apiUpstreams = Object.keys(data)
      .filter(key => key.match("/services/web/hosts/test.com/upstream"))
      .map(key => data[key])

    assert.equal(apiUpstreams.length, 2)
    assert(~apiUpstreams.indexOf("123.45.67.8:80"))
    assert(~apiUpstreams.indexOf("123.45.67.9:80"))
  })

})

