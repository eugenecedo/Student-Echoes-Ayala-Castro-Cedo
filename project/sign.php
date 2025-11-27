<?php
// Database connection
$servername = "localhost";
$username   = "root";       // default for XAMPP/WAMP
$password   = "";           // default password
$dbname     = "student_echoes";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Capture form data
$firstName = $_POST['firstName'];
$lastName  = $_POST['lastName'];
$contact   = $_POST['contact'];
$password  = $_POST['password'];

// Insert into database
$sql = "INSERT INTO users (firstName, lastName, contact, password)
        VALUES ('$firstName', '$lastName', '$contact', '$password')";

if ($conn->query($sql) === TRUE) {
    echo "<h2>Account created successfully!</h2>";
    echo "<p>First Name: " . $firstName . "</p>";
    echo "<p>Last Name: " . $lastName . "</p>";
    echo "<p>Contact: " . $contact . "</p>";
    echo "<p>Password: " . $password . "</p>";
} else {
    echo "Error: " . $sql . "<br>" . $conn->error;
}

$conn->close();
?>
