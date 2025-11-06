# Load raw venue list
$rawVenues = Get-Content 'C:\VSProjects\bndy-frontstage\venue-list-raw.txt'

# Load existing venues from database
$existingVenuesRaw = Get-Content 'C:\VSProjects\bndy-frontstage\venues-names.txt'

# Function to normalize venue names for comparison
function Normalize-VenueName {
    param($name)
    $normalized = $name -replace '^\s+|\s+$', ''  # Trim
    $normalized = $normalized -replace '\s+', ' '  # Normalize whitespace
    $normalized = $normalized -replace '[,.]$', ''  # Remove trailing punctuation
    $normalized = $normalized -replace 'St\d+\s*\d*[a-z]*', '' # Remove postcodes
    $normalized = $normalized -replace '\s+', ' '  # Normalize whitespace again
    $normalized = $normalized.Trim()
    return $normalized
}

# Parse and deduplicate user's venue list
$userVenues = @{}
foreach ($venue in $rawVenues) {
    if ([string]::IsNullOrWhiteSpace($venue)) { continue }

    # Extract main name and location
    $parts = $venue -split ','
    $mainName = Normalize-VenueName $parts[0]
    $location = if ($parts.Count -gt 1) { ($parts[1..($parts.Count-1)] -join ', ').Trim() } else { '' }

    # Standardize common variations
    $mainName = $mainName -replace "Swifty'?s?\s*(Bar|Meir)?", "Swiftys"
    $mainName = $mainName -replace "The Rigger( Venue)?", "The Rigger"
    $mainName = $mainName -replace "Eleven Sandyford.*", "Eleven"
    $mainName = $mainName -replace "The Cosey Club.*", "Cosey Club"
    $mainName = $mainName -replace "Artisan Tap.*", "Artisan Tap"
    $mainName = $mainName -replace "Moorland [Ii]nn.*", "Moorland Inn"
    $mainName = $mainName -replace "The Old Bulldog.*", "The Old Bulldog"
    $mainName = $mainName -replace "Norton Central Social Club.*", "Norton Central Social Club"
    $mainName = $mainName -replace "Black Lion Trent Vale.*", "Black Lion Trent Vale"
    $mainName = $mainName -replace "The Green Star.*", "The Green Star"
    $mainName = $mainName -replace "The Glebe Stoke.*", "The Glebe"
    $mainName = $mainName -replace "John Marston'?s?", "John Marstons"
    $mainName = $mainName -replace "Ye Ol[d|de] (Queen'?s? Head|Crown)", "Ye Olde $1"
    $mainName = $mainName -replace "The Waggon & Horses.*", "Waggon and Horses"
    $mainName = $mainName -replace "Bakers? Arms.*", "Bakers Arms"
    $mainName = $mainName -replace "Charlie Bassett'?s?", "Charlie Bassett's"
    $mainName = $mainName -replace "Checkley Community [Cc]entre.*", "Checkley Community Centre"
    $mainName = $mainName -replace "The Roebuck.*", "The Roebuck"
    $mainName = $mainName -replace "The Corner ?Pin.*", "Corner Pin"
    $mainName = $mainName -replace "Bankers? Draught.*", "Bankers Draught"
    $mainName = $mainName -replace "Crown Inn|Crown,", "Crown"
    $mainName = $mainName -replace "The Crown Wharf.*", "Crown Wharf"
    $mainName = $mainName -replace "Bod,? Stone", "bod Stone"
    $mainName = $mainName -replace "Wellington [Ii]nn.*", "Wellington Inn"
    $mainName = $mainName -replace "Catchem'?s? Corner.*", "Catchems Corner"
    $mainName = $mainName -replace "Pau Café|PaU Cafe", "PaU Cafe"
    $mainName = $mainName -replace "The Linley Tavern|The Linley", "Linley Tavern"
    $mainName = $mainName -replace "Potters? Bar", "Potters Bar"
    $mainName = $mainName -replace "Rose [N&] Crown", "Rose and Crown"
    $mainName = $mainName -replace "Swan Inn|The Swan Inn", "Swan Inn"

    # Track with location info
    $key = $mainName.ToLower()
    if (-not $userVenues.ContainsKey($key)) {
        $userVenues[$key] = @{
            Name = $mainName
            Location = $location
            Count = 1
        }
    } else {
        $userVenues[$key].Count++
        if ($location -and -not $userVenues[$key].Location) {
            $userVenues[$key].Location = $location
        }
    }
}

# Parse existing database venues
$dbVenues = @{}
foreach ($line in $existingVenuesRaw) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    $parts = $line -split '\|'
    if ($parts.Count -gt 0) {
        $name = $parts[0].Trim()
        if ($name) {
            $key = $name.ToLower()
            $dbVenues[$key] = $name
        }
    }
}

# Match venues
$matched = @()
$notFound = @()
$fuzzyMatches = @{}

foreach ($venueKey in $userVenues.Keys | Sort-Object) {
    $venue = $userVenues[$venueKey]
    $found = $false

    # Exact match
    if ($dbVenues.ContainsKey($venueKey)) {
        $matched += [PSCustomObject]@{
            UserName = $venue.Name
            DBName = $dbVenues[$venueKey]
            Location = $venue.Location
            Count = $venue.Count
            MatchType = 'Exact'
        }
        $found = $true
    }
    else {
        # Fuzzy match - check if DB venue name contains user venue or vice versa
        foreach ($dbKey in $dbVenues.Keys) {
            if ($venueKey.Contains($dbKey) -or $dbKey.Contains($venueKey)) {
                if (-not $fuzzyMatches.ContainsKey($venueKey)) {
                    $fuzzyMatches[$venueKey] = @()
                }
                $fuzzyMatches[$venueKey] += $dbVenues[$dbKey]
            }
        }

        if ($fuzzyMatches.ContainsKey($venueKey) -and $fuzzyMatches[$venueKey].Count -eq 1) {
            $matched += [PSCustomObject]@{
                UserName = $venue.Name
                DBName = $fuzzyMatches[$venueKey][0]
                Location = $venue.Location
                Count = $venue.Count
                MatchType = 'Fuzzy'
            }
            $found = $true
        }
    }

    if (-not $found) {
        $possibleMatches = if ($fuzzyMatches.ContainsKey($venueKey)) { $fuzzyMatches[$venueKey] -join ', ' } else { 'None' }
        $notFound += [PSCustomObject]@{
            Name = $venue.Name
            Location = $venue.Location
            Count = $venue.Count
            PossibleMatches = $possibleMatches
        }
    }
}

# Generate report
$report = @"
========================================
VENUE VERIFICATION REPORT
Stoke-on-Trent Area Venues
========================================

DATABASE STATS:
- Total venues in database: $($dbVenues.Count)
- Total unique venues in user list: $($userVenues.Count)
- Total mentions in raw list: $($rawVenues.Count)

MATCHING RESULTS:
- Venues FOUND in database: $($matched.Count)
- Venues NOT found in database: $($notFound.Count)

========================================
MATCHED VENUES ($($matched.Count))
========================================

"@

foreach ($match in $matched | Sort-Object UserName) {
    $report += "`n[$($match.MatchType)] $($match.UserName)"
    if ($match.UserName -ne $match.DBName) {
        $report += " => DB: $($match.DBName)"
    }
    if ($match.Location) {
        $report += " [$($match.Location)]"
    }
    $report += " (mentioned $($match.Count)x)"
}

$report += @"

========================================
VENUES NOT FOUND IN DATABASE ($($notFound.Count))
========================================

"@

foreach ($venue in $notFound | Sort-Object Name) {
    $report += "`n$($venue.Name)"
    if ($venue.Location) {
        $report += " [$($venue.Location)]"
    }
    $report += " (mentioned $($venue.Count)x)"
    if ($venue.PossibleMatches -ne 'None') {
        $report += "`n  Possible matches: $($venue.PossibleMatches)"
    }
}

# Output report
$report | Out-File 'C:\VSProjects\bndy-frontstage\venue-verification-report.txt' -Encoding utf8
Write-Host $report

# Also create CSV files for easy import
$notFound | Export-Csv 'C:\VSProjects\bndy-frontstage\venues-missing.csv' -NoTypeInformation -Encoding utf8
$matched | Export-Csv 'C:\VSProjects\bndy-frontstage\venues-matched.csv' -NoTypeInformation -Encoding utf8

Write-Host "`n========================================`n"
Write-Host "Report saved to: venue-verification-report.txt"
Write-Host "Missing venues CSV: venues-missing.csv"
Write-Host "Matched venues CSV: venues-matched.csv"
