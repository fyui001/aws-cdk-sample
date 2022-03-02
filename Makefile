docker_build:
	@docker-compose build
up:
	@docker-compose up -d

down:
	@docker-compose down
ssh:
	@docker-compose exec aws-cdk ash

build:
	@docker-compose exec aws-cdk yarn build

deploy:
	@docker-compose exec aws-cdk cdk deploy '*'

destroy:
	@@docker-compose exec aws-cdk cdk destroy '*'
