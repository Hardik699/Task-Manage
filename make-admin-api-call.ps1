# PowerShell script to make a user admin via API call
# Usage: .\make-admin-api-call.ps1 -Email "user@example.com" -ServerUrl "https://your-app-url.com"

param(
    [string]$Email = "ardikmachhi@gmail.com",
    [string]$ServerUrl = "https://your-app-url.com",
    [string]$AdminKey = "make-admin-2024"
)

Write-Host "Making user admin..." -ForegroundColor Green
Write-Host "Email: $Email" -ForegroundColor Yellow
Write-Host "Server: $ServerUrl" -ForegroundColor Yellow
Write-Host ""

$body = @{
    email = $Email
    adminKey = $AdminKey
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$ServerUrl/api/setup/make-admin" -Method POST -Body $body -ContentType "application/json"
    Write-Host "Success!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Cyan
} catch {
    Write-Host "Error occurred:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "HTTP Status: $statusCode" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green