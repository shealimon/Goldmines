$body = @{
    person_name = "Test Person"
    company_name = "Test Company"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/case-studies/generate" -Method POST -ContentType "application/json" -Body $body
    Write-Host "Success:"
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error:"
    Write-Host $_.Exception.Message
    Write-Host "Response:"
    Write-Host $_.Exception.Response
}
