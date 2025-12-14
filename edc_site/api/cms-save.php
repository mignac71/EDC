<?php
/**
 * CMS Backend for Vercel
 * Uses Vercel Blob for images and Postgres for content.json.
 */

// --- Vercel Blob Helper ---
function vercelBlobPut(array $file): ?string
{
    $token = getenv('BLOB_READ_WRITE_TOKEN');
    if (!$token) {
        return null;
    }

    $filename = basename($file['name']);
    // API v1: PUT https://blob.vercel-storage.com/<filename>
    // Requires x-api-version: 1
    $apiUrl = 'https://blob.vercel-storage.com/' . uniqid() . '-' . $filename;

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $apiUrl);
    curl_setopt($ch, CURLOPT_PUT, true);
    curl_setopt($ch, CURLOPT_INFILE, fopen($file['tmp_name'], 'r'));
    curl_setopt($ch, CURLOPT_INFILESIZE, filesize($file['tmp_name']));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $token,
        'x-api-version: 1'
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200) {
        $json = json_decode($response, true);
        return $json['url'] ?? null;
    }

    return null;
}


// --- Postgres Helper (Adapting to User's Env) ---
function getPdo(): ?PDO
{
    // User provided KV_POSTGRES_URL
    $url = getenv('KV_POSTGRES_URL') ?: getenv('POSTGRES_URL');
    if (!$url)
        return null;

    $db = parse_url($url);
    $dsn = sprintf(
        "pgsql:host=%s;port=%s;user=%s;password=%s;dbname=%s",
        $db['host'] ?? 'localhost',
        $db['port'] ?? '5432',
        $db['user'] ?? '',
        $db['pass'] ?? '',
        ltrim($db['path'] ?? '', "/")
    );

    try {
        $pdo = new PDO($dsn);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch (PDOException $e) {
        // Log error?
        return null;
    }
}

function initDb(PDO $pdo): void
{
    // Create table if not exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS cms_content (id INT PRIMARY KEY, json_data TEXT)");
    // Ensure row exists
    $stmt = $pdo->prepare("SELECT 1 FROM cms_content WHERE id = 1");
    $stmt->execute();
    if (!$stmt->fetch()) {
        $pdo->exec("INSERT INTO cms_content (id, json_data) VALUES (1, '{}')");
    }
}

function dbGet(): ?array
{
    $pdo = getPdo();
    if (!$pdo)
        return null;

    try {
        initDb($pdo); // Ensure table exists on first run
        $stmt = $pdo->query("SELECT json_data FROM cms_content WHERE id = 1");
        $json = $stmt->fetchColumn();
        return $json ? json_decode($json, true) : [];
    } catch (Exception $e) {
        return null;
    }
}

function dbSet(array $data): bool
{
    $pdo = getPdo();
    if (!$pdo)
        return false;

    try {
        $json = json_encode($data, JSON_UNESCAPED_SLASHES);
        $stmt = $pdo->prepare("UPDATE cms_content SET json_data = :json WHERE id = 1");
        $stmt->execute([':json' => $json]);
        return true;
    } catch (Exception $e) {
        return false;
    }
}


const DEFAULT_PASSWORD = 'edc_admin';
$lang = $_POST['lang'] ?? 'pl';

function t(string $pl, string $en, string $lang): string
{
    return $lang === 'en' ? $en : $pl;
}
// Auth
$hash = getenv('CMS_PASSWORD_HASH');
$plain = getenv('CMS_PASSWORD');
$passwordHash = $hash ? $hash : ($plain ? hash('sha256', $plain) : hash('sha256', DEFAULT_PASSWORD));

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $content = loadContent();
    header('Content-Type: application/json');
    echo json_encode($content);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Method not allowed');
}

if (!isset($_POST['password']) || !hash_equals($passwordHash, hash('sha256', (string) $_POST['password']))) {
    http_response_code(401);
    exit(t('Błędne hasło', 'Incorrect password', $lang));
}


// Load Content logic
function loadContent(): array
{
    // 1. Try DB
    $data = dbGet();
    if ($data !== null)
        return $data;

    // 2. Fallback to local (read-only) mostly empty or default
    $localPath = __DIR__ . '/../json/content.json';
    if (file_exists($localPath)) {
        return json_decode(file_get_contents($localPath), true) ?? [];
    }

    return ['hero' => [], 'news' => []];
}

function saveContent(array $data): void
{
    if (!dbSet($data)) {
        http_response_code(500);
        exit("Error: Database save failed. Check Postgres connection.");
    }
}

function storeImage(array $file, string $lang): ?string
{
    if (!isset($file['error']) || $file['error'] === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    $url = vercelBlobPut($file);
    if ($url)
        return $url;

    http_response_code(500);
    exit(t('Nie udało się zapisać pliku (Blob Storage Error).', 'Failed to save file (Blob Storage Error).', $lang));
}


$action = $_POST['action'] ?? '';

if ($action === 'validate') {
    exit(t('Hasło poprawne.', 'Password accepted.', $lang));
}

$content = loadContent();
if (!isset($content['news']) || !is_array($content['news']))
    $content['news'] = [];
if (!isset($content['hero']) || !is_array($content['hero']))
    $content['hero'] = [];
// Additional sections init if needed to avoid warnings
if (!isset($content['mission']))
    $content['mission'] = [];
if (!isset($content['presidium']))
    $content['presidium'] = [];


if ($action === 'updateHero') {
    $title = trim($_POST['heroTitle'] ?? '');
    $subtitle = trim($_POST['heroSubtitle'] ?? '');
    if ($title === '' || $subtitle === '')
        exit(t('Uzupełnij pola.', 'Fill fields.', $lang));

    $content['hero'] = ['title' => $title, 'subtitle' => $subtitle];
    saveContent($content);
    exit(t('Zaktualizowano.', 'Updated.', $lang));
}

if ($action === 'addNews') {
    $title = trim($_POST['title'] ?? '');
    $date = trim($_POST['date'] ?? '');
    $summary = trim($_POST['summary'] ?? '');
    $alt = trim($_POST['alt'] ?? '');

    if ($title === '' || $date === '')
        exit(t('Brak danych.', 'Missing data.', $lang));

    $newsItem = [
        'title' => $title,
        'date' => $date,
        'summary' => $summary,
        'alt' => $alt,
        'image' => null,
        'gallery' => []
    ];

    if (isset($_FILES['mainImage'])) {
        $path = storeImage($_FILES['mainImage'], $lang);
        if ($path) {
            $newsItem['image'] = $path;
            $newsItem['gallery'][] = $path;
        }
    } elseif (!empty($_POST['image_url'])) {
        $newsItem['image'] = $_POST['image_url'];
        $newsItem['gallery'][] = $_POST['image_url'];
    }

    // Generate ID
    $newsItem['id'] = uniqid('news_');

    if (isset($_FILES['gallery']['name'])) {
        $count = count($_FILES['gallery']['name']);
        for ($i = 0; $i < $count; $i++) {
            if ($_FILES['gallery']['error'][$i] === UPLOAD_ERR_OK) {
                $f = [
                    'name' => $_FILES['gallery']['name'][$i],
                    'type' => $_FILES['gallery']['type'][$i],
                    'tmp_name' => $_FILES['gallery']['tmp_name'][$i],
                    'error' => $_FILES['gallery']['error'][$i],
                    'size' => $_FILES['gallery']['size'][$i]
                ];
                $p = storeImage($f, $lang);
                if ($p)
                    $newsItem['gallery'][] = $p;
            }
        }
    }

    // Prepend to array (newest first logic, though frontend sorts)
    array_unshift($content['news'], $newsItem);
    saveContent($content);
    exit(t('Dodano pomyślnie.', 'Added successfully.', $lang));
}

if ($action === 'updateSection') {
    $section = $_POST['section'] ?? '';
    if (!in_array($section, ['mission', 'presidium']))
        exit('Invalid section');

    $data = [];
    foreach ($_POST as $k => $v) {
        if (!in_array($k, ['action', 'password', 'lang', 'section']))
            $data[$k] = trim($v);
    }
    $content[$section] = $data;
    saveContent($content);
    exit(t('Zaktualizowano.', 'Updated.', $lang));
}

if ($action === 'updatePresidium') {
    $members = json_decode($_POST['members'] ?? '[]', true);
    if (!is_array($members))
        exit('Error: Invalid data');
    $content['presidium'] = $members;
    saveContent($content);
    exit(t('Zaktualizowano prezydium.', 'Presidium updated.', $lang));
}

if ($action === 'updatePartners') {
    $partners = json_decode($_POST['partners'] ?? '[]', true);
    if (!is_array($partners))
        exit('Error: Invalid data');
    $content['partners'] = $partners;
    saveContent($content);
    exit(t('Zaktualizowano partnerów.', 'Partners updated.', $lang));
}

if ($action === 'updateContact') {
    $contact = [];
    $contact['name'] = $_POST['contactName'] ?? '';
    $contact['address'] = $_POST['contactAddress'] ?? '';
    $contact['phone'] = $_POST['contactPhone'] ?? '';
    $contact['email'] = $_POST['contactEmail'] ?? '';
    $content['contact'] = $contact;
    saveContent($content);
    exit(t('Zaktualizowano stopkę.', 'Footer updated.', $lang));
}

if ($action === 'updateDealers') {
    $dealers = json_decode($_POST['dealers'] ?? '{}', true);
    if (!is_array($dealers))
        exit('Error: Invalid data');
    $content['dealers'] = $dealers;
    saveContent($content);
    exit(t('Zaktualizowano dane mapy.', 'Map data updated.', $lang));
}

if ($action === 'deleteNews') {
    $id = $_POST['id'] ?? '';
    if (!$id)
        exit('Error: Missing ID');

    $foundIndex = -1;
    foreach ($content['news'] as $i => $item) {
        if (isset($item['id']) && $item['id'] === $id) {
            $foundIndex = $i;
            break;
        }
    }

    if ($foundIndex === -1) {
        // Fallback to index if ID missing? No, safer to fail.
        http_response_code(404);
        exit(t('Nie znaleziono wpisu.', 'Item not found.', $lang));
    }

    // Optional: Auto-delete image from Blob if it's there? 
    // For now, keep it simple to avoid deleting shared images.

    array_splice($content['news'], $foundIndex, 1);
    saveContent($content);
    exit(t('Usunięto pomyślnie.', 'Deleted successfully.', $lang));
}

if ($action === 'updateNews') {
    $id = $_POST['id'] ?? '';
    // If ID is missing, we might be editing a legacy item without ID or new item
    // But `addNews` handles creation. `updateNews` implies existing.

    $foundIndex = -1;
    foreach ($content['news'] as $i => $item) {
        if (isset($item['id']) && $item['id'] === $id) {
            $foundIndex = $i;
            break;
        }
    }

    if ($foundIndex === -1) {
        // Fallback: look for index?
        $index = (int) ($_POST['index'] ?? -1);
        if ($index >= 0 && isset($content['news'][$index])) {
            $foundIndex = $index;
            // Assign ID if missing
            if (!isset($content['news'][$index]['id'])) {
                $content['news'][$index]['id'] = uniqid('news_');
            }
        } else {
            exit('Error: Item not found');
        }
    }

    $item = &$content['news'][$foundIndex]; // Reference logic

    // Update fields...
    $item['title'] = $_POST['title'] ?? $item['title'];
    $item['date'] = $_POST['date'] ?? $item['date'];
    $item['summary'] = $_POST['summary'] ?? $item['summary'];
    $item['alt'] = $_POST['alt'] ?? $item['alt'];
    if (!empty($_POST['image_url'])) {
        $item['image'] = $_POST['image_url'];
        // Add to gallery if not present?
        if (!in_array($_POST['image_url'], $item['gallery'])) {
            $item['gallery'][] = $_POST['image_url'];
        }
    }

    // Image upload handling
    if (isset($_FILES['mainImage'])) {
        $path = storeImage($_FILES['mainImage'], $lang);
        if ($path) {
            $item['image'] = $path;
            $item['gallery'][] = $path;
        }
    }
    if (isset($_FILES['gallery']['name'])) {
        foreach ($_FILES['gallery']['name'] as $i => $name) {
            if ($_FILES['gallery']['error'][$i] === UPLOAD_ERR_OK) {
                $file = ['name' => $name, 'tmp_name' => $_FILES['gallery']['tmp_name'][$i], 'error' => 0];
                $path = storeImage($file, $lang);
                if ($path)
                    $item['gallery'][] = $path;
            }
        }
    }
    $item['gallery'] = array_values(array_unique($item['gallery']));

    saveContent($content);
    exit(t('Zaktualizowano.', 'Updated.', $lang));
}

if ($action === 'toggleVisibility') {
    $id = $_POST['id'] ?? '';

    $foundIndex = -1;
    foreach ($content['news'] as $i => $item) {
        if (isset($item['id']) && $item['id'] === $id) {
            $foundIndex = $i;
            break;
        }
    }

    if ($foundIndex === -1)
        exit('Error: Item not found');

    $currentState = $content['news'][$foundIndex]['visible'] ?? true;
    $content['news'][$foundIndex]['visible'] = !$currentState;

    saveContent($content);
    exit(t('Zmieniono widoczność.', 'Visibility toggled.', $lang));
}

if ($action === 'listMedia') {
    $token = getenv('BLOB_READ_WRITE_TOKEN');
    $blobs = [];

    // 1. Fetch from Blob
    if ($token) {
        $ch = curl_init('https://blob.vercel-storage.com');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $token]);
        $res = curl_exec($ch);
        curl_close($ch);
        $json = json_decode($res, true);
        if (isset($json['blobs'])) {
            $blobs = $json['blobs']; // Structure: [{url: "...", pathname: "..."}]
        }
    }

    // 2. Fetch from Local Files (legacy)
    $localDirs = ['../images', '../images/edc70'];
    foreach ($localDirs as $dir) {
        $files = glob(__DIR__ . "/$dir/*.{jpg,jpeg,png,gif,webp}", GLOB_BRACE);
        if ($files) {
            foreach ($files as $file) {
                // Convert absolute path to relative URL
                // __DIR__ is .../api
                // $file is .../api/../images/foo.jpg -> .../images/foo.jpg
                // We want URL relative to site root: 'images/foo.jpg'
                $relativePath = str_replace(realpath(__DIR__ . '/..') . '/', '', realpath($file));
                $blobs[] = [
                    'url' => $relativePath,
                    'pathname' => $relativePath,
                    'isLocal' => true
                ];
            }
        }
    }

    header('Content-Type: application/json');
    echo json_encode(['blobs' => $blobs]);
    exit;
}

if ($action === 'deleteMedia') {
    $url = $_POST['url'] ?? '';
    if (!$url)
        exit('Error: Missing URL');

    // Check if local
    if (strpos($url, 'blob.vercel-storage.com') === false) {
        exit(t('Nie można usunąć plików lokalnych z repozytorium.', 'Cannot delete local repository files.', $lang));
    }

    $token = getenv('BLOB_READ_WRITE_TOKEN');
    if (!$token)
        exit('Error: No token');

    // Vercel Blob Delete API: POST /delete {urls: [url]}
    // Header includes x-api-version: 1 (optional?)
    $ch = curl_init('https://blob.vercel-storage.com/delete');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['urls' => [$url]]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json'
    ]);
    $res = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($code === 200) {
        exit(t('Usunięto plik.', 'File deleted.', $lang));
    }
    exit('Error deleting file: ' . $res);
}

http_response_code(400);
exit('Unknown action');
