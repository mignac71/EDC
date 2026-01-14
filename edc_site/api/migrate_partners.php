<?php
require_once 'cms-save.php';

$content = loadContent();

// Ensure partners array exists and contains the new partner
if (!isset($content['partners']) || !is_array($content['partners'])) {
    $content['partners'] = [
        "images/partner_wurth.png",
        "images/partner_vwfs.png",
        "images/partner_castrol.png",
        "images/partner_aufinity.png"
    ];
}

$new_partner = "images/partner_porsche_informatik.png";
if (!in_array($new_partner, $content['partners'])) {
    $content['partners'][] = $new_partner;
    echo "Added Porsche Informatik to partners list.<br>";
} else {
    echo "Porsche Informatik already in partners list.<br>";
}

saveContent($content);
echo "Database updated successfully.";
?>