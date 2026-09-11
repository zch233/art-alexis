<?php
// PHP's development server only; not a production HTTP server.
$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/');
$root = '/var/www/html';
$file = realpath($root . $path);
if ($file && str_starts_with($file, $root . '/') && is_file($file)) return false;
if ($file && str_starts_with($file, $root . '/') && is_dir($file) && is_file($file . '/index.php')) {
    if (!str_ends_with($path, '/')) { header('Location: ' . $path . '/', true, 301); return true; }
    require $file . '/index.php';
    return true;
}
require $root . '/index.php';
