SHELL:=/bin/bash
PROJECT_ROOT?=$(shell git rev-parse --show-toplevel 2> /dev/null)
PROJECT_NAME?=$(shell v='$(PROJECT_ROOT)'; echo "$${v\#\#*/}")
SERVICE_NAME?=$(shell v='$(DIR)'; echo "$${v\#\#*/}")
DIR=$(shell pwd)
ENV?=dev
DOCKER_IMAGE?=mentor-graphql
LICENSE_CONFIG?="license-config.json"

.PHONY: clean-dist
clean-dist: 
	rm -rf dist

.PHONY: clean-install
clean-install:
	rm -rf node_modules

.PHONY: clean
clean: clean-install clean-dist

.PHONY: docker-build
docker-build: clean
	DOCKER_BUILDKIT=1 \
	docker build \
		-t $(DOCKER_IMAGE) \
	.

.PHONY: docker-run
docker-run:
	docker run \
			--name mentor-graphql \
			--rm \
			--init \
			-p 3001:3001 \
		$(DOCKER_IMAGE)

.PHONY: docker-run
docker-run-shell:
	docker run \
			--name mentor-graphql \
			--rm \
			-it \
			--init \
			--entrypoint /bin/bash \
			-p 3001:3001 \
		$(DOCKER_IMAGE)

.PHONY: pretty
pretty: node_modules/prettier
	npm run format

.PHONY: lint-fix
lint-fix: node_modules/eslint
	npm run lint:fix

node_modules/eslint:
	npm ci

node_modules/mocha:
	npm ci

node_modules/prettier:
	npm ci

node_modules/typescript:
	npm ci

node_modules/license-check-and-add:
	npm ci

run-env-%:
	export ENV=$* \
	&& export NODE_PATH=$(DIR) \
	&& cp $(PROJECT_ROOT)/env/$(ENV)/.env .env \
	&& npm run start

.PHONY: test
test: node_modules/mocha
	export APP_DISABLE_AUTO_START=true \
	&& export ENV=test \
	&& export NODE_PATH=$(shell pwd)/src \
	&& npm test

.PHONY: test-all
test-all: test-format test-lint test-types test

.PHONY: test-format
test-format: node_modules/prettier
	npm run test:format

.PHONY: test-lint
test-lint: node_modules/eslint
	npm run test:lint

.PHONY: test-lint
test-types: node_modules/typescript
	npm run test:types

.PHONY: license-deploy
license-deploy: node_modules/license-check-and-add
	LICENSE_CONFIG=${LICENSE_CONFIG} npm run license:deploy

.PHONY: deploy-dev
deploy-dev: 
	sls deploy -s dev

.PHONY: develop
develop:
	echo ENSURE you have a .env file at the root of the project with the correct values
	npx serverless offline -s offline -r us-east-1 --aws-profile mentorpal