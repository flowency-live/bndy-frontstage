$venues = Get-Content 'C:\VSProjects\bndy-frontstage\venues-with-location.json' | ConvertFrom-Json
$output = @()

foreach ($item in $venues.Items) {
    $name = $item.name.S
    $city = if ($item.city.S) { $item.city.S } else { '' }
    $address = if ($item.address.S) { $item.address.S } else { '' }
    $postcode = if ($item.postcode.S) { $item.postcode.S } else { '' }

    $output += "$name|$city|$address|$postcode"
}

$output | Sort-Object | Out-File 'C:\VSProjects\bndy-frontstage\venues-full-data.txt' -Encoding utf8
Write-Host "Extracted $($venues.Items.Count) venues with location data"
