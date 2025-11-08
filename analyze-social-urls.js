const fs = require('fs');

// Read the JSON file
const data = JSON.parse(fs.readFileSync('c:\VSProjects\bndy-frontstage\response.json', 'utf8'));

// Fields to check
const urlFields = [
  'facebookUrl',
  'instagramUrl',
  'websiteUrl',
  'youtubeUrl',
  'spotifyUrl',
  'twitterUrl'
];

// Check if a URL is malformed
function isMalformed(url) {
  if (!url || url === '' || url === null) {
    return false; // Empty/null is OK
  }
  
  // Check if it starts with http:// or https://
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return false; // Properly formed
  }
  
  return true; // Malformed
}

// Get suggested fix
function getSuggestedFix(url) {
  if (!url || url === '') return url;
  return 'https://' + url;
}

// Analysis results
const results = {
  totalArtists: 0,
  artistsWithIssues: 0,
  totalMalformedUrls: 0,
  fieldBreakdown: {},
  affectedArtists: [],
  patterns: {}
};

// Initialize field breakdown
urlFields.forEach(field => {
  results.fieldBreakdown[field] = 0;
});

// Process each artist
data.forEach(artist => {
  results.totalArtists++;
  
  const artistIssues = {
    id: artist.id,
    name: artist.name || 'Unknown',
    issues: []
  };
  
  // Check each URL field
  urlFields.forEach(field => {
    const url = artist[field];
    if (isMalformed(url)) {
      results.totalMalformedUrls++;
      results.fieldBreakdown[field]++;
      
      artistIssues.issues.push({
        field: field,
        current: url,
        suggested: getSuggestedFix(url)
      });
      
      // Track patterns
      const pattern = url.split('/')[0]; // Get the domain part
      results.patterns[pattern] = (results.patterns[pattern] || 0) + 1;
    }
  });
  
  // Check socialMediaUrls array if present
  if (artist.socialMediaUrls && Array.isArray(artist.socialMediaUrls)) {
    artist.socialMediaUrls.forEach((socialMedia, index) => {
      if (socialMedia.url && isMalformed(socialMedia.url)) {
        results.totalMalformedUrls++;
        
        artistIssues.issues.push({
          field: `socialMediaUrls[${index}]`,
          platform: socialMedia.platform || 'Unknown',
          current: socialMedia.url,
          suggested: getSuggestedFix(socialMedia.url)
        });
        
        const pattern = socialMedia.url.split('/')[0];
        results.patterns[pattern] = (results.patterns[pattern] || 0) + 1;
      }
    });
  }
  
  // If this artist has issues, add to affected list
  if (artistIssues.issues.length > 0) {
    results.artistsWithIssues++;
    results.affectedArtists.push(artistIssues);
  }
});

// Calculate data quality score
results.dataQualityScore = {
  cleanPercentage: ((results.totalArtists - results.artistsWithIssues) / results.totalArtists * 100).toFixed(2),
  issuesPercentage: (results.artistsWithIssues / results.totalArtists * 100).toFixed(2)
};

// Sort patterns by frequency
results.patternsSorted = Object.entries(results.patterns)
  .sort((a, b) => b[1] - a[1])
  .map(([pattern, count]) => ({ pattern, count }));

// Output results as JSON
console.log(JSON.stringify(results, null, 2));
