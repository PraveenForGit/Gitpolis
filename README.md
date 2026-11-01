# Gitpolis

A GitHub profile analyzer that goes beyond stars and languages - classifies commits as real code pushes vs. docs-only changes, and visualizes language breakdown and top repos.

## Features
- Look up any public GitHub profile by username
- View profile info, top repos by stars (forks excluded), and language distribution
- **Commit Mix classifier** — samples recent commits on the user's top repo and classifies each as a genuine code push or a docs-only push (README/CONTRIBUTING/etc.), surfaced as a donut chart

## Tech stack
Next.js (App Router) · TypeScript · Tailwind CSS · Recharts · GitHub REST API

## Why the commit classifier?
Repo stats like stars and language don't tell you whether someone is actually shipping code or just padding contributions with README edits (common in Hacktoberfest-style contributions). This project samples a user's recent commits and inspects the files changed in each one to make that distinction - implemented with an explicit rate-limit budget so it stays within GitHub's API limits for a live demo.

## Running locally
1. Clone the repo
2. `npm install`
3. Create a `.env.local` file with appropriate API setup
4. The project shall be up.
