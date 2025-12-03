<?php
session_start();
require_once '../config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['email'])) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit();
}

$email = $_SESSION['email'];
$name = $_POST['name'] ?? '';

// Update name if provided
if ($name) {
    $stmt = $conn->prepare("UPDATE echoes SET name = ? WHERE email = ?");
    $stmt->bind_param("ss", $name, $email);
    $stmt->execute();
}

// Handle avatar upload
$avatar_url = null;
if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
    $upload_dir = '../uploads/avatars/';
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }
    
    $file_ext = pathinfo($_FILES['avatar']['name'], PATHINFO_EXTENSION);
    $filename = uniqid() . '.' . $file_ext;
    $destination = $upload_dir . $filename;
    
    if (move_uploaded_file($_FILES['avatar']['tmp_name'], $destination)) {
        $avatar_url = 'uploads/avatars/' . $filename;
    }
}

echo json_encode([
    'success' => true,
    'name' => $name,
    'avatar' => $avatar_url
]);
?>