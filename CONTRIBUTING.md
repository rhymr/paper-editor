# Contributing to Rhymr

Thank you for your interest in contributing to Rhymr! This project is a modern, AI-powered lyric and poetry writing editor with rhyme and syllable tools, chat, and file management. Below you'll find guidelines and information to help you get started.

## Tech Stack
- **Frontend:** HTML, CSS (custom, no framework), vanilla JavaScript (ES6+ modules)
- **Editor:** Custom editor logic, CodeMirror (if present)
- **AI/Chat:** OpenAI API integration (chat, model selection)
- **Utilities:** Custom JS modules for rhyme, syllable counting, dragbar, etc.
- **Build:** Rollup (see `rollup.config.mjs`)
- **Package Management:** npm

## Getting Started
1. **Clone the repository:**
   ```sh
   git clone <repo-url>
   cd web
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Run the development server:**
   ```sh
   npm run dev
   ```
   (Or use your preferred static server for HTML/JS/CSS development.)

## Project Structure
- `src/` — Main JavaScript modules and utilities
- `src/styles/` — CSS files
- `api/` — Static data (e.g., `words.json`)
- `assets/` — Images and other assets
- `words/` — Word and rhyme logic
- `editor.html` — Main app HTML

## Contribution Guidelines
- **Open an issue** for bugs, feature requests, or questions before submitting a PR.
- **Fork the repo** and create a feature branch (`feature/your-feature` or `fix/your-bug`).
- **Write clear, concise commit messages.**
- **Keep code style consistent** (use existing patterns in JS and CSS).
- **Test your changes** before submitting a pull request.
- **Document new features** in the README or with inline comments as appropriate.

## Feature Ideas & TODOs
See `README.md` for the current roadmap and feature ideas.

## Contact
For questions or help, open an issue or contact the maintainer.

---
Happy writing and coding!
