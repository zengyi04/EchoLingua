# EchoLingua API smoke test
# Run with server at http://localhost:8000
# Usage: .\tests\test_apis.ps1  (from backend/)  or  powershell -File tests\test_apis.ps1

$ErrorActionPreference = "Stop"
$base = "http://localhost:8000"
$failed = 0

function Test-Step {
    param($Name, $ScriptBlock)
    try {
        & $ScriptBlock
        Write-Host "  [PASS] $Name" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "  [FAIL] $Name" -ForegroundColor Red
        Write-Host "        $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

Write-Host "`nEchoLingua API Tests" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan

# 0. Health check
$ok = Test-Step "GET / (health)" {
    $r = Invoke-RestMethod -Uri $base -Method GET
    if ($r.status -ne "ok") { throw "Unexpected response: $r" }
}
if (-not $ok) { $failed++; Write-Host "`nServer may not be running. Start with: python main.py" -ForegroundColor Yellow; exit 1 }

# Use unique email so script can be run multiple times
$email = "test_$([DateTimeOffset]::Now.ToUnixTimeSeconds())@example.com"

# 1. Register
$token = $null
$ok = Test-Step "POST /auth/register" {
    $reg = Invoke-RestMethod -Uri "$base/auth/register" -Method POST -ContentType "application/json" `
        -Body (@{name="TestUser";email=$email;password="pass123";role="learner"} | ConvertTo-Json)
    $script:token = $reg.token
    if (-not $script:token) { throw "No token returned" }
}
if (-not $ok) { $failed++ }

# 2. GET /users/me (requires token)
$ok = Test-Step "GET /users/me" {
    $me = Invoke-RestMethod -Uri "$base/users/me" -Headers @{Authorization="Bearer $token"}
    if (-not $me.id) { throw "No user id in response" }
}
if (-not $ok) { $failed++ }

# 3. GET /recordings
$ok = Test-Step "GET /recordings" {
    $recs = Invoke-RestMethod -Uri "$base/recordings" -Method GET
    $count = if ($recs) { @($recs).Count } else { 0 }
    Write-Host "        ($count recordings)" -ForegroundColor Gray
}
if (-not $ok) { $failed++ }

# 4. POST /stories (requires token)
$sid = $null
$ok = Test-Step "POST /stories" {
    $body = @{title="Forest Spirit";language="iban";text="Long ago...";tags=@("folklore")} | ConvertTo-Json
    $story = Invoke-RestMethod -Uri "$base/stories" -Method POST -ContentType "application/json" `
        -Body $body -Headers @{Authorization="Bearer $token"}
    $script:sid = $story.story.id
    if (-not $script:sid) { throw "No story id returned" }
}
if (-not $ok) { $failed++ }

# 5. GET /stories
$ok = Test-Step "GET /stories" {
    $stories = Invoke-RestMethod -Uri "$base/stories" -Method GET
    $count = if ($stories) { @($stories).Count } else { 0 }
    Write-Host "        ($count stories)" -ForegroundColor Gray
}
if (-not $ok) { $failed++ }

# 6. GET /stories/{id}
if ($sid) {
    $ok = Test-Step "GET /stories/$sid" {
        $s = Invoke-RestMethod -Uri "$base/stories/$sid" -Method GET
        if ($s.title -ne "Forest Spirit") { throw "Unexpected title: $($s.title)" }
    }
    if (-not $ok) { $failed++ }
}

# 7. GET /recordings/{id} - 404 if none (valid behavior)
$ok = Test-Step "GET /recordings/invalid-id (expect 400)" {
    try {
        Invoke-RestMethod -Uri "$base/recordings/notavalidid" -Method GET
        throw "Should have returned 400"
    } catch {
        if ($_.Exception.Response.StatusCode.Value__ -eq 400) { return }
        throw
    }
}
if (-not $ok) { $failed++ }

# 8. POST /lessons (Core)
$lid = $null
$ok = Test-Step "POST /lessons" {
    $body = @{
        title="Basic Greetings"
        category="greetings"
        difficulty="beginner"
        language="iban"
        vocabulary=@(@{word="Selamat";translation="Hello";audioUrl=""})
        quiz=@(@{question="What does Selamat mean?";options=@("Hello","Food","Tree");answer="Hello"})
    } | ConvertTo-Json -Depth 5
    $lesson = Invoke-RestMethod -Uri "$base/lessons" -Method POST -ContentType "application/json" -Body $body
    $script:lid = $lesson.lesson.id
    if (-not $script:lid) { throw "No lesson id returned" }
}
if (-not $ok) { $failed++ }

# 9. GET /lessons
$ok = Test-Step "GET /lessons" {
    $lessons = Invoke-RestMethod -Uri "$base/lessons" -Method GET
    $count = if ($lessons) { @($lessons).Count } else { 0 }
    Write-Host "        ($count lessons)" -ForegroundColor Gray
}
if (-not $ok) { $failed++ }

# 10. GET /lessons/{id}
if ($lid) {
    $ok = Test-Step "GET /lessons/$lid" {
        $l = Invoke-RestMethod -Uri "$base/lessons/$lid" -Method GET
        if ($l.title -ne "Basic Greetings") { throw "Unexpected title: $($l.title)" }
    }
    if (-not $ok) { $failed++ }
}

# 11. GET /analytics/language-usage (Core)
$ok = Test-Step "GET /analytics/language-usage" {
    $stats = Invoke-RestMethod -Uri "$base/analytics/language-usage" -Method GET
    if ($null -eq $stats) { throw "No response" }
    Write-Host "        ($($stats | ConvertTo-Json -Compress))" -ForegroundColor Gray
}
if (-not $ok) { $failed++ }

Write-Host ""
if ($failed -eq 0) {
    Write-Host "All API tests passed." -ForegroundColor Green
    exit 0
} else {
    Write-Host "$failed test(s) failed." -ForegroundColor Red
    exit 1
}
