# Load raw venue list
$rawVenues = Get-Content 'C:\VSProjects\bndy-frontstage\venue-list-raw.txt'

# Load existing venues from database - just names
$dbVenueNames = Get-Content 'C:\VSProjects\bndy-frontstage\db-venue-names-only.txt'

# Function to normalize venue names for STRICT comparison
function Normalize-Strict {
    param($name)
    $normalized = $name -replace '^\s+|\s+$', ''  # Trim
    $normalized = $normalized -replace '\s+', ' '  # Normalize whitespace
    $normalized = $normalized -replace "['']", ''  # Remove apostrophes
    $normalized = $normalized -replace '[.,&@-]', ''  # Remove punctuation
    $normalized = $normalized -replace '\b(the|inn|pub|bar|tavern|hotel|club|venue|restaurant)\b', '', 'IgnoreCase'  # Remove common words
    $normalized = $normalized -replace '\s+', ' '  # Normalize whitespace again
    $normalized = $normalized.Trim().ToLower()
    return $normalized
}

# Parse and deduplicate user's venue list
Write-Host "Parsing user venue list..."
$userVenues = @{}
foreach ($venue in $rawVenues) {
    if ([string]::IsNullOrWhiteSpace($venue)) { continue }

    # Extract main name and location
    $parts = $venue -split ','
    $mainName = $parts[0].Trim()

    # Remove postcodes from name
    $mainName = $mainName -replace 'St\d+\s*\d*[a-z]*', ''
    $mainName = $mainName -replace 'CW\d+\s*\d*[a-z]*', ''
    $mainName = $mainName.Trim()

    $location = if ($parts.Count -gt 1) { ($parts[1..($parts.Count-1)] -join ', ').Trim() } else { '' }

    # Standardize common variations
    $mainName = $mainName -replace "Swifty'?s?\s*(Bar|Meir)?", "Swiftys", 'IgnoreCase'
    $mainName = $mainName -replace "The Rigger( Venue)?", "The Rigger", 'IgnoreCase'
    $mainName = $mainName -replace "Eleven Sandyford.*", "Eleven", 'IgnoreCase'
    $mainName = $mainName -replace "The Cosey Club.*", "Cosey Club", 'IgnoreCase'
    $mainName = $mainName -replace "Artisan Tap.*", "Artisan Tap", 'IgnoreCase'
    $mainName = $mainName -replace "Moorland [Ii]nn.*", "Moorland Inn", 'IgnoreCase'
    $mainName = $mainName -replace "The Old Bulldog.*", "The Old Bulldog", 'IgnoreCase'
    $mainName = $mainName -replace "Norton Central Social Club.*", "Norton Central Social Club", 'IgnoreCase'
    $mainName = $mainName -replace "Black Lion Trent Vale.*", "Black Lion Trent Vale", 'IgnoreCase'
    $mainName = $mainName -replace "The Green Star.*", "The Green Star", 'IgnoreCase'
    $mainName = $mainName -replace "The Glebe Stoke.*", "The Glebe", 'IgnoreCase'
    $mainName = $mainName -replace "Wellington [Ii]nn.*", "Wellington Inn", 'IgnoreCase'
    $mainName = $mainName -replace "Catchem'?s? Corner.*", "Catchems Corner", 'IgnoreCase'
    $mainName = $mainName -replace "Pool Dole.*", "Pool Dole", 'IgnoreCase'
    $mainName = $mainName -replace "Granville'?s?(\s+Stone)?", "Granvilles", 'IgnoreCase'
    $mainName = $mainName -replace "John Marston'?s?", "John Marston", 'IgnoreCase'

    # Track with location info
    $key = $mainName.ToLower()
    if (-not $userVenues.ContainsKey($key)) {
        $userVenues[$key] = @{
            Name = $mainName
            OriginalName = $mainName
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

Write-Host "Found $($userVenues.Count) unique venues in user list"

# Parse existing database venues with normalized keys
Write-Host "Parsing database venues..."
$dbVenues = @{}
$dbVenuesNormalized = @{}
foreach ($venueName in $dbVenueNames) {
    if ([string]::IsNullOrWhiteSpace($venueName)) { continue }
    $name = $venueName.Trim()
    if ($name) {
        # Store with original case for display
        $key = $name.ToLower()
        $dbVenues[$key] = $name

        # Also store with strict normalization for fuzzy matching
        $normalizedKey = Normalize-Strict $name
        if (-not $dbVenuesNormalized.ContainsKey($normalizedKey)) {
            $dbVenuesNormalized[$normalizedKey] = @()
        }
        $dbVenuesNormalized[$normalizedKey] += $name
    }
}

Write-Host "Found $($dbVenues.Count) venues in database"

# Match venues
Write-Host "Matching venues..."
$matched = @()
$notFound = @()

foreach ($venueKey in $userVenues.Keys | Sort-Object) {
    $venue = $userVenues[$venueKey]
    $found = $false
    $matchType = 'None'
    $dbMatch = $null

    # 1. Exact match (case-insensitive)
    if ($dbVenues.ContainsKey($venueKey)) {
        $matchType = 'Exact'
        $dbMatch = $dbVenues[$venueKey]
        $found = $true
    }

    # 2. Normalized fuzzy match
    if (-not $found) {
        $normalizedUserName = Normalize-Strict $venue.Name
        if ($dbVenuesNormalized.ContainsKey($normalizedUserName)) {
            if ($dbVenuesNormalized[$normalizedUserName].Count -eq 1) {
                $matchType = 'Fuzzy-Normalized'
                $dbMatch = $dbVenuesNormalized[$normalizedUserName][0]
                $found = $true
            }
            elseif ($dbVenuesNormalized[$normalizedUserName].Count -gt 1) {
                # Multiple matches - pick the closest one
                $matchType = 'Fuzzy-Multiple'
                $dbMatch = $dbVenuesNormalized[$normalizedUserName] -join ' OR '
                $found = $true
            }
        }
    }

    # 3. Partial match (DB name contains user name or vice versa)
    if (-not $found) {
        $possibleMatches = @()
        foreach ($dbKey in $dbVenues.Keys) {
            $dbName = $dbVenues[$dbKey]
            $userNameClean = $venue.Name -replace '[^a-zA-Z0-9\s]', ''
            $dbNameClean = $dbName -replace '[^a-zA-Z0-9\s]', ''

            if ($dbNameClean -match [regex]::Escape($userNameClean) -or $userNameClean -match [regex]::Escape($dbNameClean)) {
                $possibleMatches += $dbName
            }
        }

        if ($possibleMatches.Count -eq 1) {
            $matchType = 'Fuzzy-Contains'
            $dbMatch = $possibleMatches[0]
            $found = $true
        }
        elseif ($possibleMatches.Count -gt 1) {
            $matchType = 'Multiple-Possible'
            $dbMatch = ($possibleMatches | Select-Object -First 3) -join ' OR '
        }
    }

    if ($found) {
        $matched += [PSCustomObject]@{
            UserName = $venue.Name
            DBName = $dbMatch
            Location = $venue.Location
            Count = $venue.Count
            MatchType = $matchType
        }
    } else {
        $possibleMatches = if ($matchType -eq 'Multiple-Possible') { $dbMatch } else { 'None' }
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
VENUE VERIFICATION REPORT (IMPROVED)
Stoke-on-Trent Area Venues
========================================

DATABASE STATS:
- Total venues in database: $($dbVenues.Count)
- Total unique venues in user list: $($userVenues.Count)
- Total mentions in raw list: $($rawVenues.Count)

MATCHING RESULTS:
- Venues FOUND in database: $($matched.Count) ($([math]::Round(($matched.Count / $userVenues.Count) * 100, 1))%)
- Venues NOT found in database: $($notFound.Count) ($([math]::Round(($notFound.Count / $userVenues.Count) * 100, 1))%)

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
$report | Out-File 'C:\VSProjects\bndy-frontstage\venue-verification-report-v2.txt' -Encoding utf8
Write-Host $report

# Also create CSV files for easy import
$notFound | Export-Csv 'C:\VSProjects\bndy-frontstage\venues-missing-v2.csv' -NoTypeInformation -Encoding utf8
$matched | Export-Csv 'C:\VSProjects\bndy-frontstage\venues-matched-v2.csv' -NoTypeInformation -Encoding utf8

Write-Host "`n========================================`n"
Write-Host "Report saved to: venue-verification-report-v2.txt"
Write-Host "Missing venues CSV: venues-missing-v2.csv"
Write-Host "Matched venues CSV: venues-matched-v2.csv"
