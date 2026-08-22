.PHONY: test serve deploy

test:
	node --test test/*.test.js

serve:
	python3 -m http.server 8080

# Publishes the working tree to the gh-pages branch (requires a git remote named origin).
deploy:
	git checkout --orphan gh-pages-tmp && git add -A && git commit -m "deploy" \
	  && git push -f origin gh-pages-tmp:gh-pages && git checkout - && git branch -D gh-pages-tmp
