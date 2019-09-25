PACKAGE=github.com/SparebankenVest/gitops-flux-dashboard/client

DOCKER_INTERNAL_REG=dokken.azurecr.io
DOCKER_RELEASE_REG=spvest

DOCKER_IMAGE=gitops-flux-dashboard

DOCKER_INTERNAL_TAG := $(shell git rev-parse --short HEAD)
DOCKER_RELEASE_TAG := $(shell git describe)

BUILD_DATE := $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")
VCS_URL := https://$(PACKAGE)

.PHONY: build test push pull-release deploy

build:
	docker build . -t $(DOCKER_INTERNAL_REG)/$(DOCKER_IMAGE):$(DOCKER_INTERNAL_TAG) -f Dockerfile --build-arg PACKAGE=$(PACKAGE) --build-arg VCS_REF=$(DOCKER_INTERNAL_TAG) --build-arg BUILD_DATE=$(BUILD_DATE) --build-arg VCS_URL=$(VCS_URL)

test:
	npm test

push:
	docker push $(DOCKER_INTERNAL_REG)/$(DOCKER_IMAGE):$(DOCKER_INTERNAL_TAG)

deploy: build push

pull-release:
	docker pull $(DOCKER_INTERNAL_REG)/$(DOCKER_IMAGE):$(DOCKER_INTERNAL_TAG) 

release:
	docker tag $(DOCKER_INTERNAL_REG)/$(DOCKER_IMAGE):$(DOCKER_INTERNAL_TAG) $(DOCKER_RELEASE_REG)/$(DOCKER_IMAGE):$(DOCKER_RELEASE_TAG)
	docker push $(DOCKER_RELEASE_REG)/$(DOCKER_IMAGE):$(DOCKER_RELEASE_TAG)
