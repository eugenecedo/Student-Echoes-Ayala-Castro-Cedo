<?php
// Database connection
$servername = "localhost";
$username   = "root";       // default XAMPP/WAMP username
$password   = "";           // default XAMPP/WAMP password
$dbname     = "student_portal";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Capture form data
$email    = $_POST['email'];
$password = $_POST['password'];

// Insert into database
$sql = "INSERT INTO users (email, password) VALUES ('$email', '$password')";

if ($conn->query($sql) === TRUE) {
    echo "<h2>Data successfully saved!</h2>";
    echo "<p>Email: " . $email . "</p>";
    echo "<p>Password: " . $password . "</p>";
} else {
    echo "Error: " . $sql . "<br>" . $conn->error;
}

$conn->close();
?>
