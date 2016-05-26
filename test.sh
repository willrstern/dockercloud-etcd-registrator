docker network create autoregister-test
docker run -d --net autoregister-test --name etcd elcolio/etcd
docker run -d --net autoregister-test --name web \
  -e "DOCKERCLOUD_IP_ADDRESS=123.45.67.8" \
  -e "SERVICE_PORT=80" \
  -e "SERVICE_NAME=web" \
  -e "SERVICE_VIRTUAL_HOSTS=test.com,test2.com" \
  -e "SERVICE_TAGS=nginx:primary" \
  -e "SERVICE_CERTS=cert1,cert2" \
  dockercloud/hello-world

docker-compose up -d
docker build -f Dockerfile.test -t test .
docker run --rm --net autoregister-test --name test -v /var/run/docker.sock:/var/run/docker.sock test
docker stop etcd web && docker rm etcd web
docker network rm autoregister-test
