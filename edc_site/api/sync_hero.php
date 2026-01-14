<?php
/**
 * One-time script to sync Hero Background images to the database.
 */
define('CMS_SKIP_ROUTING', true);
require_once 'cms-save.php';

// Default images from the old system (images/banner/)
$images = ["L1331163.jpg", "L1331191.jpg", "L1331292.jpg", "L1331305.jpg", "L1331545.jpg", "L1331561.jpg", "L1331797.jpg", "L1331819.jpg", "L1331877.jpg", "network_1.png", "network_2.png", "network_3.png"];
$heroImages = array_map(fn($img) => "images/banner/$img", $images);

try {
    $content = loadContent();

    // Initialize hero if missing
    if (!isset($content['hero'])) {
        $content['hero'] = ['title' => '', 'subtitle' => ''];
    }

    // Seed images
    $content['hero']['images'] = $heroImages;

    saveContent($content);
    echo "Successfully seeded " . count($heroImages) . " images into Hero Slideshow.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
