# EDC Project Context

This document provides essential context for AI agents working on the European Dealer Council (EDC) project.

## Project Overview
The EDC website is the official portal for the European Dealer Council, connecting Volkswagen and Audi dealers across Europe. It provides information about the council's mission, presidium, latest news, and a map of dealers.

## Tech Stack
- **Frontend**: Standard HTML5, vanilla JavaScript, and CSS.
- **Backend/API**: PHP (used for CMS functionality and data persistence).
- **Database**: Neon (PostgreSQL) is the primary storage for content and user data.
- **Hosting/Deployment**: Vercel (using `vercel-php@0.7.4` runtime for PHP scripts).
- **Libraries**: Leaflet.js (for the interactive map).

## Project Structure
- `/` (Root):
    - `AGENT_CONTEXT.md`: This file.
    - `README.md`: Basic project information.
    - `edc_site/`: Core application directory.
- `/edc_site/`:
    - `index.html`: The main landing page.
    - `cms.html`: The Content Management System (CMS) panel for managing site content.
    - `cms-content.js`: Main logic for loading and displaying CMS-managed content.
    - `styles.css`: Central stylesheet for the site and CMS.
    - `api/`: Contains PHP scripts for handling data (e.g., `cms-save.php`).
    - `images/`: Local assets (logos, partner logos, team member photos).
    - `json/`: Directory for local data fallback (e.g., `content.json`, `db_state.json`).
    - `navbar.js`, `animations.js`, `hero-banner.js`, `map.js`, `slideshow.js`: Component-specific JavaScript logic.

## Key Functionalities
- **CMS**: Accessible via `cms.html`, allowing users to update Hero content, Mission cards, Presidium members, News items, Partners, and Dealer counts on the map.
- **Interactive Map**: Displays dealer statistics by country using Leaflet.js.
- **Dynamic Content**: Most site content is served via a Neon PostgreSQL database managed by `api/cms-save.php`.

## Critical Notes for Agents
- **PHP on Vercel**: The project uses a specific Vercel runtime for PHP. Ensure that any backend changes are compatible with `vercel-php`.
- **Vanilla JS**: The frontend avoids heavy frameworks; keep additions consistent with the existing vanilla JS and modular script structure.
- **Data Persistence (Neon)**: 
    - Content is stored in the `cms_content` table (id=1, `json_data` column).
    - Users/Auth are managed in the `cms_users` table.
    - Database connection is managed via `KV_POSTGRES_URL` or `POSTGRES_URL` environment variables.
    - There is a fallback mechanism to local JSON files (`edc_site/json/content.json`) if the database is unavailable.

## Available Integrations (MCP Servers)
AI agents have access to the following MCP servers to assist with development and resource management:
- **context7**: For retrieving up-to-date documentation and code examples.
- **google-sheets**: For interacting with spreadsheets (often used for data sync in other EDC projects).
- **mcp-server-neon**: For Neon PostgreSQL database management and query tuning.
- **vercel**: For managing deployments, build logs, and project configuration.
