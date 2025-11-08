const { execSync } = require('child_process');

console.log('Scanning all artists in DynamoDB...');
const json = execSync('aws dynamodb scan --table-name bndy-artists --region eu-west-2', {encoding: 'utf8', maxBuffer: 10 * 1024 * 1024});
const data = JSON.parse(json);

const extract = (item) => item && item.S ? item.S : '';

const check = (url) => {
  if (!url || url === '') return null;
  url = url.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) return url;
  return null;
};

const malformed = [];
const items = data.Items || [];

items.forEach(artist => {
  const id = extract(artist.id);
  const name = extract(artist.name);

  ['facebookUrl', 'instagramUrl', 'websiteUrl', 'youtubeUrl', 'spotifyUrl', 'twitterUrl'].forEach(field => {
    const url = extract(artist[field]);
    const bad = check(url);
    if (bad) {
      malformed.push({ name, id, field, url: bad });
    }
  });
});

console.log('');
if (malformed.length > 0) {
  console.log('MALFORMED URLs FOUND:');
  console.log('='.repeat(80));
  malformed.forEach(m => {
    console.log(`${m.name} (${m.id})`);
    console.log(`  ${m.field}: "${m.url}"`);
  });
  console.log('='.repeat(80));
  console.log(`Total: ${malformed.length} malformed URLs in ${items.length} artists`);
} else {
  console.log('SUCCESS: ALL URLs PROPERLY FORMATTED!');
  console.log(`Scanned ${items.length} artists - no issues found`);
}
