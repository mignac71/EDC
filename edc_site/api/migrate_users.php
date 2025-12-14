<?php
/**
 * Migration Script V5: Initialize Users Table
 */

function getPdo(): ?PDO
{
    $url = getenv('KV_POSTGRES_URL') ?: getenv('POSTGRES_URL');
    if (!$url)
        die('No DB URL');

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
        die('DB Connection Failed: ' . $e->getMessage());
    }
}

$pdo = getPdo();

// Create table
$pdo->exec("CREATE TABLE IF NOT EXISTS cms_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'editor'
)");

// Insert default users if not exist
$users = [
    ['admin', 'edc_admin', 'admin'],
    ['editor', 'edc_editor', 'editor']
];

foreach ($users as $u) {
    $stmt = $pdo->prepare("SELECT 1 FROM cms_users WHERE username = ?");
    $stmt->execute([$u[0]]);
    if (!$stmt->fetch()) {
        $hash = password_hash($u[1], PASSWORD_DEFAULT);
        $ins = $pdo->prepare("INSERT INTO cms_users (username, password_hash, role) VALUES (?, ?, ?)");
        $ins->execute([$u[0], $hash, $u[2]]);
        echo "User '{$u[0]}' created.<br>";
    } else {
        echo "User '{$u[0]}' exists.<br>";
    }
}

echo "Migration V5 Complete: Users table ready.";
