SHELL := /bin/bash

swag:
	~/go/bin/swag init -g ./backend/cmd/server/main.go -o ./backend/docs
	~/go/bin/swag fmt

debug: swag
	docker compose up db -d 
	cd backend && go run ./cmd/server/main.go

local:
	docker compose up --build -d

local-with-logs:
	docker compose up --build

stop:
	docker compose down
