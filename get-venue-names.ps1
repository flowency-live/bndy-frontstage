$venues = Get-Content 'C:\VSProjects\bndy-frontstage\existing-venues.json' | ConvertFrom-Json
$venues.Items | ForEach-Object { $_.name.S } | Sort-Object | Out-File 'C:\VSProjects\bndy-frontstage\db-venue-names-only.txt' -Encoding utf8
Write-Host "Found $($venues.Items.Count) venues in database"
