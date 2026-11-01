// Writes version.json with the date of the deployed commit, for the Whysice hub's "Updated" line.
// Never fails the build: if git is unavailable the file says so and the hub keeps its fallback date.
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
let updated = '';
try { updated = execSync('git log -1 --format=%cs', { encoding: 'utf8' }).trim(); } catch { /* no git history */ }
if (!/^\d{4}-\d{2}-\d{2}$/.test(updated)) updated = '';
writeFileSync(new URL('../version.json', import.meta.url), JSON.stringify({ updated }) + '\n');
console.log(`version.json: ${updated || 'no commit date available'}`);
