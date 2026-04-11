local_path	:= $(PWD)

host := webgl2fundamentals.pentatrion.com

.PHONY: deploy
deploy: ## Build and deploy playground
	rsync -av --delete \
		$(local_path)/out/ \
		gap:$(host)
	@echo "go : https://$(host)"
