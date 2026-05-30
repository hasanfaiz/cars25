<?php
// PHP Mailtrap endpoint for PHP hosting. On Vercel, use /api/contact.js instead.
// Install dependencies inside this php folder: composer install

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/vendor/autoload.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

function clean_value($value) {
    return trim(strip_tags((string)($value ?? '')));
}

$name = clean_value($input['name'] ?? '');
$phone = clean_value($input['phone'] ?? '');
$email = clean_value($input['email'] ?? '');
$vehicle = clean_value($input['vehicle'] ?? '');
$message = clean_value($input['message'] ?? '');
$source = clean_value($input['source'] ?? 'Cars25 website enquiry');

if (!$name || !$phone || !$message) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => 'Name, phone and message are required.']);
    exit;
}

$required = ['MAILTRAP_HOST', 'MAILTRAP_PORT', 'MAILTRAP_USER', 'MAILTRAP_PASS', 'MAIL_TO', 'MAIL_FROM'];
foreach ($required as $key) {
    if (!getenv($key)) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'message' => "Mail setting missing: $key"]);
        exit;
    }
}

$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host = getenv('MAILTRAP_HOST');
    $mail->Port = (int)getenv('MAILTRAP_PORT');
    $mail->SMTPAuth = true;
    $mail->Username = getenv('MAILTRAP_USER');
    $mail->Password = getenv('MAILTRAP_PASS');
    if ((int)getenv('MAILTRAP_PORT') === 465) {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    }

    $mail->setFrom(getenv('MAIL_FROM'), 'Cars25 Website');
    $mail->addAddress(getenv('MAIL_TO'));
    if ($email) {
        $mail->addReplyTo($email, $name);
    }
    $mail->Subject = $vehicle ? "Cars25 enquiry: $vehicle" : 'Cars25 website enquiry';
    $mail->isHTML(true);
    $mail->Body = "<h2>New Cars25 enquiry</h2><p><strong>Source:</strong> {$source}</p><p><strong>Name:</strong> {$name}</p><p><strong>Phone:</strong> {$phone}</p><p><strong>Email:</strong> " . ($email ?: 'Not provided') . "</p><p><strong>Vehicle:</strong> " . ($vehicle ?: 'General enquiry') . "</p><p><strong>Message:</strong><br>" . nl2br($message) . "</p>";
    $mail->AltBody = "New Cars25 enquiry\n\nSource: $source\nName: $name\nPhone: $phone\nEmail: " . ($email ?: 'Not provided') . "\nVehicle: " . ($vehicle ?: 'General enquiry') . "\nMessage:\n$message";
    $mail->send();
    echo json_encode(['ok' => true, 'message' => 'Enquiry sent.']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Unable to send enquiry.']);
}
