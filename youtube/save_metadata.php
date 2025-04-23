<?php
// Allow CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');


function getYouTubeVideoId($url) {
    $parsedUrl = parse_url($url);

    if (strpos($url, 'watch') !== false && isset($parsedUrl['query'])) {
        parse_str($parsedUrl['query'], $urlParams);
        return $urlParams['v'] ?? null;
    }

    if (strpos($url, '/shorts/') !== false && isset($parsedUrl['path'])) {
        $parts = explode('/', $parsedUrl['path']);
        return $parts[2] ?? null;
    }

    return null;
}
// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Read JSON data from request body
$data = json_decode(file_get_contents("php://input"), true);

// Log received data for debugging
//file_put_contents('php://stderr', print_r($data, true));

if (isset($data['title'], $data['url'], $data['type'], $data['fetchTime'])) {
    $connection = mysqli_connect("localhost", "root", "root", "youtube_research");

    if (!$connection) {
        file_put_contents('php://stderr', "Connection failed: " . mysqli_connect_error() . "\n");
        echo json_encode(["status" => "error", "message" => "Database connection failed"]);
        exit();
    }

    file_put_contents('php://stderr', "Database connection successful.\n");

    $title = $data['title'];
    $url = $data['url'];
    $type = $data['type'];
    $fetchTime = $data['fetchTime'];

    // Check if URL already exists using prepared statement
    $checkStmt = mysqli_prepare($connection, "SELECT id FROM youtube_metadata WHERE url = ? LIMIT 1");
    mysqli_stmt_bind_param($checkStmt, "s", $url);
    mysqli_stmt_execute($checkStmt);
    mysqli_stmt_store_result($checkStmt);

    if (mysqli_stmt_num_rows($checkStmt) > 0) {
        echo json_encode(["status" => "duplicate", "message" => "URL already exists, not inserting"]);
        file_put_contents('php://stderr', "Record Already Exists\n");
    } else {
        // Format fetchTime
        try {
            try {
                date_default_timezone_set('America/Indiana/Indianapolis');
                $formattedFetchTime = date('Y-m-d H:i:s');
            
                // Extra sanity check
                if ($formattedFetchTime === '1970-01-01 00:00:00' || strlen($fetchTime) < 10) {
                    throw new Exception('Invalid fetchTime detected');
                }
            } catch (Exception $e) {
                $formattedFetchTime = date('Y-m-d H:i:s');
                file_put_contents('php://stderr', "FetchTime parsing failed, using current time: $formattedFetchTime\n");
            }

            $videoId = getYouTubeVideoId($url);

            // Fetch likeCount and commentCount from YouTube API
            $apiKey = "AIzaSyC5pXUA4VhL7kwsUWWCVlA-Co1iO6wXAQ8";
            $apiUrl = "https://www.googleapis.com/youtube/v3/videos?part=statistics&id=$videoId&key=$apiKey";
            $snippetUrl = "https://www.googleapis.com/youtube/v3/videos?part=snippet&id=$videoId&key=$apiKey";

            $apiResponse = file_get_contents($apiUrl);
            $apiData = json_decode($apiResponse, true);

            $snippetResponse = file_get_contents($snippetUrl);
            $snippetData = json_decode($snippetResponse, true);

            $likeCount = 0;
            $commentCount = 0;
            $viewCount = 0;

            if (!empty($apiData['items'][0]['statistics'])) {
                $likeCount = $apiData['items'][0]['statistics']['likeCount'] ?? 0;
                $commentCount = $apiData['items'][0]['statistics']['commentCount'] ?? 0;
                $viewCount = $apiData['items'][0]['statistics']['viewCount'] ?? 0;
                $publishedDate = $snippetData['items'][0]['snippet']['publishedAt'] ?? 0;
            }

            $cleanPublishTime = preg_replace('/\.\d+Z$/', '', $publishedDate); // remove .xxxZ
            $cleanPublishTime = str_replace('T', ' ', $cleanPublishTime); // replace T with space
            
            $dateTimeObj = new DateTime($cleanPublishTime);
            $formattedPublishTime = $dateTimeObj->format('Y-m-d H:i:s');


            $userTags = isset($data['userTags']) ? $data['userTags'] : '';

            // Insert new record using prepared statement
            $insertStmt = mysqli_prepare($connection, "INSERT INTO youtube_metadata (title, url, type, fetch_time, likes_count, comments_count, view_count, tags, publish_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            mysqli_stmt_bind_param($insertStmt, "ssssiiiss", $title, $url, $type, $formattedFetchTime, $likeCount, $commentCount, $viewCount, $userTags, $formattedPublishTime);

            if (mysqli_stmt_execute($insertStmt)) {
                echo json_encode(["status" => "success", "message" => "Data saved successfully"]);
            } else {
                file_put_contents('php://stderr', "Insert error: " . mysqli_error($connection) . "\n");
                echo json_encode(["status" => "error", "message" => "Failed to insert data"]);
            }

            mysqli_stmt_close($insertStmt);
        } catch (Exception $e) {
            echo json_encode(["status" => "error", "message" => "Invalid fetch time format"]);
            file_put_contents('php://stderr', "Datetime parsing error: " . $e->getMessage() . "\n");
        }
    }

    mysqli_stmt_close($checkStmt);
    mysqli_close($connection);
} else {
    echo json_encode(["status" => "error", "message" => "Missing required fields"]);
}
?>