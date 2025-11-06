$venues = Get-Content 'C:\VSProjects\bndy-frontstage\existing-venues.json' | ConvertFrom-Json
$venues.Items | ForEach-Object {
    $name = $_.name.S
    $city = if ($_.city.S) { $_.city.S } else { 'N/A' }
    $postcode = if ($_.postcode.S) { $_.postcode.S } else { 'N/A' }
    "$name | $city | $postcode"
} | Sort-Object | Out-File 'C:\VSProjects\bndy-frontstage\venues-names.txt' -Encoding utf8
