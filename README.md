[![CircleCI](https://circleci.com/gh/willrstern/dockercloud-etcd-registrator/tree/master.svg?style=shield)](https://circleci.com/gh/willrstern/dockercloud-etcd-registrator/tree/master)
# Dockercloud-Etcd-Registrator

### This container will opinionatedly auto-register all of your Docker Cloud containers to Etcd.
It's designed to be used with [willrstern/nginx-etcd](https://github.com/willrstern/docker-cloud-nginx-load-balancing) for dynamic nginx load balancing

### This was created out of 2 limitations:
- [Registrator](https://github.com/gliderlabs/registrator) is a great solution for auto-registration, but does not pick up on Docker Cloud's internal Weave IP address
- Docker Cloud's API cannot be used/queried like a registry.  The amount of requests would exceed rate limits.

## Run it!
```yaml
version: "2"
services:
  registrator:
    image: willrstern/dockercloud-etcd-registrator
    deployment_strategy: "EVERY_NODE"
    # optional configuration through env vars
    environment:
      # default "etcd"
      - "ETCD_HOST=<some-host-or-ip>"
      # default 5000ms
      - "REGISTER_INTERVAL=10000"
      # default 30s
      - "TTL=60"
      # output lots of logs
      - "DEBUG=true"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
  etcd:
    image: elcolio/etcd
  # a service to register
  web:
    image: dockercloud/hello-world
    environment:
      - "DOCKERCLOUD_IP_ADDRESS=123.45.67.8"
      - "SERVICE_PORT=80"
      - "SERVICE_NAME=web"
      - "SERVICE_VIRTUAL_HOSTS=test.com,test2.com,test3.com"
      - "SERVICE_TAGS=nginx:primary"
      - "SERVICE_CERTS=cert1string,cert2string"
  web2:
    image: dockercloud/hello-world
    environment:
      - "DOCKERCLOUD_IP_ADDRESS=123.45.67.9"
      - "SERVICE_PORT=80"
      - "SERVICE_NAME=web"
      - "SERVICE_VIRTUAL_HOSTS=test.com,test2.com,test3.com"
      - "SERVICE_TAGS=nginx:primary"
      - "SERVICE_CERTS=cert1string,cert2string"
```

This will result in an ETCD structure like this:

```
services:
  web:
    tags:
      nginx: 'primary'
    hosts:
      test.com:
        ssl: true
        cert: cert1string
        upstream:
          1b9d3522da76: '123.45.67.8:80'
          c7c508e915ed: '123.45.67.9:80'
      test2.com:
        ssl: true
        cert: cert2string
        upstream:
          1b9d3522da76: '123.45.67.8:80'
          c7c508e915ed: '123.45.67.9:80'
      test3.com:
        upstream:
          1b9d3522da76: '123.45.67.8:80'
          c7c508e915ed: '123.45.67.9:80'
```




