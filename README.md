# Koala Nightmares

A first-person web horror game. Static — no build step, no bundler. Three.js is vendored in `vendor/`.

## Play locally
```
make serve        # http://localhost:8080
```
(Modules need an http server; opening `index.html` from disk won't work.)

## Flow
1. Title → house picture ("out of town for the weekend") → fade.
2. **House**: learn the controls, collect all 9 items (glowing path guides you; `E` to pick up, choose a slot 1–9 or swap).
3. **Jungle**: mid afternoon, getting darker. Study 3 animals (`E`); sub-goal: place tent (`6`) and sleeping bag (`5`) with a click. Then follow the path back… the koala ambush.
4. **Dark**: the voice (`assets/vicious_koala.mp3`, see `assets/README.md`).
5. **Challenge 1**: survive the giant koala for 60s. Tagged → clock resets.
6. **Challenge 2**: 60s obstacle course. Jump hurdles, duck (`C`/`Ctrl`) under bars, dodge red blocks. Hit or timeout → restart the course.
7. **Challenge 3**: fight the koala with your items; ammo and medkits lie around the arena. Lose → back to challenge 1. Win → go home.

## Controls
`WASD` move · mouse look · `Space` jump · `Shift` sprint (unlimited) · `C`/`Ctrl` crouch · `E` interact · `1–9` select item · click to use.

## Dev
- `make test` — unit tests (inventory, challenge rules, pathfinding).
- `?stage=jungle|dark|chase|obstacle|fight` — jump straight to a scene with a full pack.

## Deploy
Push to `main`: `.github/workflows/deploy.yml` runs the tests and publishes to GitHub Pages (set Pages source to "GitHub Actions" in repo settings). `make deploy` is the manual alternative (force-pushes the tree to a `gh-pages` branch).
