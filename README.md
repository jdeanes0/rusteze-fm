# Rusteze-FM

## What is Rusteze File Manager?
Rusteze File Manager is a project made by four Frostburg State University students as their final project for an undergraduate programming language principles course.
The app allows you to remotely manage and view files in a directory on the host computer by use of a wrapped web server.

## Installation
*Dependencies needed: git, cargo, npm*

Clone the repository.

Then, in `rusteze-server/`, run `cargo install` to install the required crates. 

Secondly, in `rusteze-frontend`, run `npm install` to acquire the correct dependencies (there aren't many, just tailwind).

## Running
Running the project once installed is just as simple as `cargo build` and `cargo run`. From there, you can access the project at localhost:8080/web.

## Customization
We used tailwind to help design the client page. If you want to make modifications to the tailwind, you will need to run `npx tailwindcss -i style.css -o twstyle.css` from within `rusteze-frontend/`. Alternatively, you can edit the CSS directly, if that's your thing.

<hr>

### A note for contributors
When you want to add to the repository, create a feature branch with:
```
git checkout -b <feature_branch> master
```
Then, push that branch to the repository and create a pull request through GitHub to merge into master.

Finally, on branches that are not master after the PR completes:
```
git rebase -i master
```
