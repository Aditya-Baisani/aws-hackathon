param()
$handlers = "auth", "upload", "plans", "content", "doubts", "progress", "quiz", "notifications"
$outDir = ".\zips"

if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

foreach ($name in $handlers) {
    $handlerFile = ".\handlers\$name.py"
    if (!(Test-Path $handlerFile)) {
        Write-Host "Skipping $name - file not found"
        continue
    }

    $zipPath = (Resolve-Path $outDir).Path + "\$name.zip"
    if (Test-Path $zipPath) { Remove-Item $zipPath }

    $tmp = (Resolve-Path $outDir).Path + "\_tmp_$name"
    if (Test-Path $tmp) { Remove-Item -Recurse -Force $tmp }
    New-Item -ItemType Directory -Path $tmp | Out-Null
    New-Item -ItemType Directory -Path "$tmp\utils" | Out-Null

    Copy-Item $handlerFile "$tmp\lambda_function.py"
    Copy-Item ".\utils\auth.py"     "$tmp\utils\auth.py"
    Copy-Item ".\utils\bedrock.py"  "$tmp\utils\bedrock.py"
    Copy-Item ".\utils\dynamodb.py" "$tmp\utils\dynamodb.py"
    Copy-Item ".\utils\response.py" "$tmp\utils\response.py"

    # Explicitly pass both the file AND the utils folder so Compress-Archive includes both
    $items = @("$tmp\lambda_function.py", "$tmp\utils")
    Compress-Archive -Path $items -DestinationPath $zipPath -Force

    Remove-Item -Recurse -Force $tmp
    Write-Host "Created $zipPath"
}

Write-Host ""
Write-Host "Done! Upload each zip to AWS Lambda."
Write-Host "Handler must be: lambda_function.handler"
