.PHONY: test serve deploy

test:
	node --test test/*.test.js

serve:
	python3 -m http.server 8080

# Publishes the current commit to gh-pages (the whole repo is the site; commit first).
deploy:
	git push -f origin HEAD:gh-pages