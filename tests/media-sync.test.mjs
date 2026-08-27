import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { replaceStandaloneDataset } from '../tools/lib/media-sync.mjs';

test('actualiza el dashboard autónomo con finales de línea Windows o Unix', (t) => {
  for (const lineEnding of ['\r\n', '\n']) {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'media-sync-'));
    t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
    const file = path.join(directory, 'dashboard-standalone.html');
    fs.writeFileSync(
      file,
      [
        '<script>',
        'window.MEDIA_DASHBOARD_DATA = {"old":true};',
        '</script>',
        '',
      ].join(lineEnding),
      'utf8',
    );

    replaceStandaloneDataset(file, { total: 106 });

    assert.equal(
      fs.readFileSync(file, 'utf8'),
      [
        '<script>',
        'window.MEDIA_DASHBOARD_DATA = {"total":106};',
        '</script>',
        '',
      ].join(lineEnding),
    );
  }
});
