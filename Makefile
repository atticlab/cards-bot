ARGS = $(filter-out $@,$(MAKECMDGOALS))
MAKEFLAGS += --silent
CONTAINERS = $(shell docker ps -a -q)
VOLUMES = $(shell docker volume ls |awk 'NR>1 {print $2}')
COMPOSER_DIR = $(realpath $(PWD))
list:
	sh -c "echo; $(MAKE) -p no_targets__ | awk -F':' '/^[a-zA-Z0-9][^\$$#\/\\t=]*:([^=]|$$)/ {split(\$$1,A,/ /);for(i in A)print A[i]}' | grep -v '__\$$' | grep -v 'Makefile'| sort"

#############################
# Docker machine states
#############################

stop:
	docker-compose stop

build:
	@if [ ! -f ./.env ]; then\
  	read -p "Enter riak host (domain only):" riak_host; echo "RIAK_HOST=$$riak_host" >> ./.env; \
  	read -p "Enter horizon host (with protocol and port):" horizon_host; echo "HORIZON_HOST=$$horizon_host" >> ./.env; \
	fi
	docker-compose build
	docker-compose up -d

attach:
	docker exec -i -t ${c} /bin/bash