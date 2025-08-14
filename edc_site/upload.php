<?php
// Simple upload handler for banner images
// Protect with hashed password (sha256('edc_admin'))

const PASSWORD_HASH = '37ba3d76293846ac3d3314714ef3a4438450b9c5ff48ab0c0252af9e2efe5285';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Metoda niedozwolona');
}

if (!isset($_POST['password']) || $_POST['password'] !== PASSWORD_HASH) {
    http_response_code(401);
    exit('Błędne hasło');
}

if (!isset($_FILES['banner']) || $_FILES['banner']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    exit('Nieprawidłowy plik');
}

$allowed = ['jpg','jpeg','png','gif'];
$ext = strtolower(pathinfo($_FILES['banner']['name'], PATHINFO_EXTENSION));
if (!in_array($ext, $allowed)) {
    http_response_code(400);
    exit('Niedozwolony format pliku');
}

$targetDir = __DIR__ . '/images/banner/';
$filename = basename($_FILES['banner']['name']);
$filename = preg_replace('/[^A-Za-z0-9_.-]/', '_', $filename);
$targetPath = $targetDir . $filename;

if (!move_uploaded_file($_FILES['banner']['tmp_name'], $targetPath)) {
    http_response_code(500);
    exit('Nie udało się zapisać pliku');
}

list($width, $height) = getimagesize($targetPath);
if ($width > 1600) {
    $ratio = 1600 / $width;
    $newWidth = 1600;
    $newHeight = (int)($height * $ratio);

    switch ($ext) {
        case 'jpg':
        case 'jpeg':
            $src = imagecreatefromjpeg($targetPath);
            break;
        case 'png':
            $src = imagecreatefrompng($targetPath);
            break;
        case 'gif':
            $src = imagecreatefromgif($targetPath);
            break;
    }

    $dst = imagecreatetruecolor($newWidth, $newHeight);
    imagecopyresampled($dst, $src, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

    switch ($ext) {
        case 'jpg':
        case 'jpeg':
            imagejpeg($dst, $targetPath, 90);
            break;
        case 'png':
            imagepng($dst, $targetPath);
            break;
        case 'gif':
            imagegif($dst, $targetPath);
            break;
    }

    imagedestroy($src);
    imagedestroy($dst);
}

$jsonPath = $targetDir . 'banner-images.json';
$data = [];
if (file_exists($jsonPath)) {
    $content = file_get_contents($jsonPath);
    $data = json_decode($content, true);
    if (!is_array($data)) {
        $data = [];
    }
}

if (!in_array($filename, $data)) {
    $data[] = $filename;
    file_put_contents($jsonPath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}

echo 'Plik przesłany pomyślnie';
?>
