<?php
header('Content-Type: application/json');

// Database connection
$conn = new mysqli("localhost", "root", "", "feed_db");
if ($conn->connect_error) { die("Connection failed: " . $conn->connect_error); }

// Handle new post
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['post_text'])) {
    $text = $_POST['post_text'];
    $cat  = $_POST['post_category'];
    $img  = "";

    if (!empty($_FILES['post_image']['name'])) {
        $target_dir = "uploads/";
        if (!is_dir($target_dir)) { mkdir($target_dir, 0777, true); }
        $img = $target_dir . basename($_FILES["post_image"]["name"]);
        move_uploaded_file($_FILES["post_image"]["tmp_name"], $img);
    }

    $sql = "INSERT INTO feeds (text, category, image) VALUES ('$text', '$cat', '$img')";
    $conn->query($sql);
}

// Fetch posts with comments and reactions
$data = [];
$result = $conn->query("SELECT * FROM feeds ORDER BY created_at DESC");
while ($post = $result->fetch_assoc()) {
    // Get comments
    $comments = [];
    $cRes = $conn->query("SELECT * FROM comments WHERE post_id=" . $post['id']);
    while ($c = $cRes->fetch_assoc()) { $comments[] = $c; }

    // Get reactions
    $reactions = [];
    $rRes = $conn->query("SELECT type, COUNT(*) as count FROM reactions WHERE post_id=" . $post['id'] . " GROUP BY type");
    while ($r = $rRes->fetch_assoc()) { $reactions[] = $r; }

    $post['comments']  = $comments;
    $post['reactions'] = $reactions;
    $data[] = $post;
}

echo json_encode($data);
$conn->close();
?>
