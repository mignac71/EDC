# EDC Project Context

This document provides essential context for AI agents working on the European Dealer Council (EDC) project.

## Project Overview
The EDC website is the official portal for the European Dealer Council, connecting Volkswagen and Audi dealers across Europe. It provides information about the council's mission, presidium, latest news, and a map of dealers.

## Tech Stack
- **Frontend**: Standard HTML5, vanilla JavaScript, and CSS
  - Browser Compatibility: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
  - No build process required - direct HTML/CSS/JS
- **Backend/API**: PHP 8.0+ (used for CMS functionality and data persistence)
  - Compatible with `vercel-php@0.7.4` runtime
- **Database**: Neon (PostgreSQL 15+) for primary storage of content and user data
- **Hosting/Deployment**: Vercel
  - Zero-downtime deployments via Git integration
  - PHP runtime: `vercel-php@0.7.4`
- **Libraries**: 
  - Leaflet.js v1.9.4 (interactive map visualization)
  - Google Fonts: Inter, Outfit (typography)

## Project Structure
- `/` (Root):
    - `AGENT_CONTEXT.md`: This file
    - `README.md`: Basic project information
    - `.agent/workflows/`: Workflow definitions
    - `edc_site/`: Core application directory
- `/edc_site/`:
    - `index.html`: The main landing page
    - `cms.html`: The Content Management System (CMS) panel for managing site content
    - `cms-content.js`: Main logic for loading and displaying CMS-managed content
    - `styles.css`: Central stylesheet for the site and CMS
    - `api/`: Contains PHP scripts for handling data
        - `cms-save.php`: Main backend API for CMS operations
    - `images/`: Local assets (logos, partner logos, team member photos)
    - `json/`: Directory for local data fallback (e.g., `content.json`, `db_state.json`)
    - `navbar.js`, `animations.js`, `hero-banner.js`, `map.js`, `slideshow.js`: Component-specific JavaScript logic

## Database Schema

### Table: `cms_content`
Primary table storing all website content as JSON.

- `id` (INTEGER, PRIMARY KEY): Record identifier (always 1 - single-row design)
- `json_data` (TEXT): JSON containing all site content

**Content Structure Example:**
```json
{
  "hero": {
    "title": "European Dealer Council",
    "subtitle": "Connecting dealers across Europe",
    "images": ["url1.jpg", "url2.jpg"]
  },
  "mission": {
    "title": "Our Mission",
    "lead": "We are the voice...",
    "cards": [
      {"title": "Card 1", "text": "Description..."}
    ]
  },
  "news": [
    {
      "id": "news_abc123",
      "title": "Event Title",
      "date": "2026-01-20",
      "summary": "Description",
      "image": "url.jpg",
      "gallery": ["url1.jpg", "url2.jpg"],
      "alt": "Alt text",
      "visible": true
    }
  ],
  "presidium": [
    {
      "name": "John Doe",
      "role": "President",
      "country": "Germany",
      "image": "photo.jpg"
    }
  ],
  "partners": [
    {"url": "logo.png", "link": "https://partner.com"}
  ],
  "dealers": {
    "DE": {"audi": 500, "vw": 1200, "vwc": 300},
    "PL": {"audi": 80, "vw": 150, "vwc": 45}
  },
  "contact": {
    "name": "Organization Name",
    "address": "Street, City",
    "phone": "+49...",
    "email": "info@example.com"
  }
}
```

### Table: `cms_users`
User authentication for CMS access.

- `id` (INTEGER, PRIMARY KEY): User identifier
- `username` (VARCHAR): Login username
- `password_hash` (TEXT): bcrypt hashed password (using `password_hash()` in PHP)

## Key Functionalities
- **CMS**: Accessible via `cms.html`, allowing users to update:
  - Hero content (title, subtitle, background slideshow)
  - Mission cards
  - Presidium members
  - News items (with image uploads to Vercel Blob)
  - Partners
  - Dealer counts on the map
- **Interactive Map**: Displays dealer statistics by country using Leaflet.js
- **Dynamic Content**: Most site content is served via Neon PostgreSQL database managed by `api/cms-save.php`
- **Media Library**: Images stored in Vercel Blob with fallback to local `/images/` directory

## Common Workflows

### Deployment
The project uses automated deployment via Vercel:
1. Make changes and commit to Git
2. Push to `main` branch on GitHub
3. Use the `/deploy` workflow command or push directly
4. Vercel automatically builds and deploys
5. Monitor deployment status via Vercel dashboard (accessible through MCP tools)

**Manual deployment check:**
```bash
git status
git add .
git commit -m "Description of changes"
git push origin main
```

### Adding Content via CMS
1. Navigate to `https://yourdomain.com/cms.html`
2. Login with credentials (stored in `cms_users` table)
3. Expand relevant section (Hero, News, Partners, etc.)
4. Fill in fields or upload images
5. Click "Save" - changes persist to Neon PostgreSQL
6. Verify changes on main site (auto-refresh may be needed)

### Database Operations
**Connecting to database:**
- Use `mcp-server-neon` tools for direct database access
- Connection string stored in `KV_POSTGRES_URL` environment variable

**Common queries:**
```sql
-- View all content
SELECT json_data FROM cms_content WHERE id = 1;

-- List all users
SELECT username FROM cms_users;
```

### Local Development
1. Clone repository
2. Set up environment variables in `.env` (see Security Considerations)
3. Use local PHP server: `php -S localhost:8000 -t edc_site`
4. Access at `http://localhost:8000`

### Debugging
- **Frontend issues**: Browser DevTools console
- **API errors**: Check `api/cms-save.php` response via Network tab
- **Database issues**: Use MCP `mcp-server-neon` tools to query database
- **Deployment failures**: Use MCP `vercel` tools to check build logs
- **PHP errors**: Check Vercel function logs via `mcp_vercel_get_deployment_build_logs`

## Code Examples

### Fetching Content from Database (PHP)
```php
function dbGet(): ?array {
    $pdo = getPdo();
    if (!$pdo) return null;
    
    try {
        $stmt = $pdo->query("SELECT json_data FROM cms_content WHERE id = 1");
        $json = $stmt->fetchColumn();
        return $json ? json_decode($json, true) : [];
    } catch (Exception $e) {
        return null;
    }
}
```

### Saving Content to Database (PHP)
```php
function dbSet(array $data): bool {
    $pdo = getPdo();
    if (!$pdo) return false;
    
    try {
        $json = json_encode($data, JSON_UNESCAPED_SLASHES);
        $stmt = $pdo->prepare("UPDATE cms_content SET json_data = :json WHERE id = 1");
        $stmt->execute([':json' => $json]);
        return true;
    } catch (Exception $e) {
        return false;
    }
}
```

### Loading Dynamic Content (JavaScript)
```javascript
async function loadContent() {
    try {
        const response = await fetch('api/cms-save.php', { cache: 'no-cache' });
        if (!response.ok) return;
        const data = await response.json();
        
        // Apply content to page
        applyHeroCopy(data.hero);
        renderNews(data.news);
    } catch (err) {
        console.error('Unable to load CMS content', err);
    }
}
```

### Uploading Image to Vercel Blob (PHP)
```php
function vercelBlobPut(array $file): ?string {
    $token = getenv('BLOB_READ_WRITE_TOKEN');
    if (!$token) return null;
    
    $filename = basename($file['name']);
    $filePath = $file['tmp_name'];
    $mime = mime_content_type($filePath) ?: 'application/octet-stream';
    
    $ch = curl_init('https://blob.vercel-storage.com');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents($filePath));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $token,
        'Content-Type: ' . $mime,
        'x-vercel-filename: ' . $filename,
    ]);
    
    $response = curl_exec($ch);
    $json = json_decode($response, true);
    return $json['url'] ?? null;
}
```

## Security Considerations

### Authentication
- **CMS Access**: Password-based authentication using bcrypt hashing
- **User Table**: `cms_users` stores username and `password_hash`
- **Legacy Auth**: Environment variable `CMS_PASSWORD` (deprecated, use database auth)

### Environment Variables
Critical secrets stored in Vercel project settings:
- `KV_POSTGRES_URL` / `POSTGRES_URL`: Neon database connection string
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob storage access token
- `CMS_PASSWORD_HASH` (optional): Legacy password hash

**Never commit these to Git!** Always use Vercel's environment variable management.

### CORS & CSP
- **CORS**: Not configured - same-origin requests only
- **CSP**: No Content Security Policy currently implemented
- **File Uploads**: Restricted to image types only (validated server-side)

### Data Validation
- All user inputs are sanitized in `cms-save.php`
- SQL injection prevention via PDO prepared statements
- XSS protection: HTML entities escaped in frontend rendering

## Troubleshooting

### Database Connection Failures
**Symptom:** Content loads from local JSON instead of database  
**Causes:**
- `KV_POSTGRES_URL` not set in Vercel environment
- Database server unreachable
- Invalid credentials in connection string

**Solution:**
1. Verify environment variable in Vercel dashboard
2. Test connection using MCP `mcp-server-neon` tools
3. Check Neon database status

### PHP Runtime Errors on Vercel
**Symptom:** 500 errors on API endpoints  
**Causes:**
- PHP syntax incompatible with `vercel-php` runtime
- Missing PHP extensions
- Incorrect file paths

**Solution:**
1. Check Vercel build logs: `mcp_vercel_get_deployment_build_logs`
2. Ensure PHP version compatibility (8.0+)
3. Test locally with `php -S localhost:8000`

### CMS Login Issues
**Symptom:** Cannot authenticate despite correct password  
**Causes:**
- Password hash mismatch
- User not in `cms_users` table
- Database connection failed

**Solution:**
```sql
-- Verify user exists
SELECT username, password_hash FROM cms_users;

-- Reset password (generate hash first)
UPDATE cms_users SET password_hash = '$2y$...' WHERE username = 'admin';
```

### Images Not Displaying
**Symptom:** Broken image links in news or hero sections  
**Causes:**
- Vercel Blob upload failed
- Incorrect URL in database
- CORS issues with external images

**Solution:**
1. Check `BLOB_READ_WRITE_TOKEN` is set
2. Verify image URLs in database: `SELECT json_data FROM cms_content WHERE id = 1`
3. Use Media Library in CMS to verify uploads

### Map Not Loading
**Symptom:** Leaflet map fails to display  
**Causes:**
- Leaflet.js CDN unavailable
- Dealer data missing in database
- JavaScript errors

**Solution:**
1. Check browser console for errors
2. Verify `dealers` object in database
3. Test Leaflet CDN: `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js`

## Critical Notes for Agents
- **PHP on Vercel**: The project uses a specific Vercel runtime for PHP. Ensure that any backend changes are compatible with `vercel-php@0.7.4`. Avoid using PHP features not supported by this runtime.
- **Vanilla JS**: The frontend avoids heavy frameworks; keep additions consistent with the existing vanilla JS and modular script structure. Do not introduce build tools (webpack, vite) unless explicitly requested.
- **Single-Row Database Pattern**: `cms_content` uses ID=1 for all content. Always use `WHERE id = 1` in queries.
- **Data Persistence (Neon)**: 
    - Content is stored in the `cms_content` table (id=1, `json_data` column)
    - Users/Auth are managed in the `cms_users` table
    - Database connection is managed via `KV_POSTGRES_URL` or `POSTGRES_URL` environment variables
    - There is a fallback mechanism to local JSON files (`edc_site/json/content.json`) if the database is unavailable
- **Image Storage**: Primary storage is Vercel Blob. Local `/images/` directory serves as read-only fallback for legacy images.
- **No Build Process**: All HTML/CSS/JS is served directly. Changes are immediately live after deployment.

## Available Integrations (MCP Servers)
AI agents have access to the following MCP servers to assist with development and resource management:
- **context7**: For retrieving up-to-date documentation and code examples from popular frameworks
- **google-sheets**: For interacting with spreadsheets (can be used for data sync if needed)
- **mcp-server-neon**: For Neon PostgreSQL database management, query tuning, and schema operations
- **vercel**: For managing deployments, checking build logs, and project configuration

## Testing Strategy

### Manual Testing Checklist
After making changes, verify:
- [ ] CMS login works
- [ ] Content updates persist after page refresh
- [ ] Hero slideshow transitions correctly
- [ ] News items display with images
- [ ] Map loads and displays dealer counts
- [ ] Mobile responsiveness (test on narrow viewport)
- [ ] All navigation links work
- [ ] Footer contact information displays correctly

### Browser Testing
Test on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest, if available)
- Mobile Safari / Chrome Mobile

### API Testing
Use browser DevTools Network tab or curl:
```bash
# Test content fetch
curl https://yourdomain.com/api/cms-save.php

# Test authentication (replace with actual credentials)
curl -X POST https://yourdomain.com/api/cms-save.php \
  -d "action=validate&username=admin&password=yourpass"
```

## Additional Resources
- **Vercel Dashboard**: Monitor deployments and check logs
- **Neon Console**: Database management and metrics
- **Leaflet Documentation**: https://leafletjs.com/reference.html
- **Vercel PHP Runtime**: https://github.com/vercel-community/php

---

*Last updated: 2026-01-20*
