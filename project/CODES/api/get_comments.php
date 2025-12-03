<?php
session_start();
require_once '../config.php';

header('Content-Type: application/json');

$post_id = $_GET['post_id'] ?? 0;

$sql = "SELECT pc.*, e.name, e.email 
        FROM post_comments pc 
        JOIN echoes e ON pc.user_id = e.id 
        WHERE pc.post_id = ? 
        ORDER BY pc.created_at ASC";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $post_id);
$stmt->execute();
$result = $stmt->get_result();

$comments = [];
while ($row = $result->fetch_assoc()) {
    $comments[] = [
        'id' => (int)$row['id'],
        'author' => [
            'name' => $row['name'],
            'avatar' => 'https://i.pravatar.cc/36?u=' . urlencode($row['email'])
        ],
        'text' => $row['comment'],
        'createdAt' => strtotime($row['created_at']) * 1000,
        'replies' => []
    ];
}

echo json_encode(['success' => true, 'comments' => $comments]);
?>