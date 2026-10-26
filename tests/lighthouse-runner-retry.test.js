'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const runner = path.resolve(__dirname, '../scripts/run-lighthouse-with-retry.sh');

function runScenario(mode) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'lighthouse-retry-'));
  const bin = path.join(temp, 'bin');
  fs.mkdirSync(bin);
  const state = path.join(temp, 'calls.txt');
  const output = path.join(temp, 'report.json');
  const fakeLighthouse = path.join(bin, 'lighthouse');

  fs.writeFileSync(fakeLighthouse, `#!/usr/bin/env bash
set -u
state="$FAKE_STATE"
count=0
[[ -f "$state" ]] && count=$(cat "$state")
count=$((count + 1))
printf '%s' "$count" > "$state"
out=''
for arg in "$@"; do
  case "$arg" in --output-path=*) out="${arg#*=}" ;; esac
done
case "$FAKE_MODE" in
  success)
    printf '{"ok":true}' > "$out"
    exit 0
    ;;
  transient-then-success)
    if [[ "$count" -eq 1 ]]; then
      echo 'Runtime error encountered: waiting for dynamic debugging port in chrome-err.log' >&2
      exit 1
    fi
    printf '{"ok":true}' > "$out"
    exit 0
    ;;
  transient-always)
    echo 'Runtime error encountered: waiting for dynamic debugging port in chrome-err.log' >&2
    exit 1
    ;;
  permanent)
    echo 'non-transient network failure' >&2
    exit 7
    ;;
esac
exit 9
`);
  fs.chmodSync(fakeLighthouse, 0o755);

  const result = spawnSync('bash', [runner, 'https://example.test/', output], {
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: bin + path.delimiter + process.env.PATH,
      FAKE_STATE: state,
      FAKE_MODE: mode,
      LIGHTHOUSE_RETRY_DELAY_SECONDS: '0',
    },
  });
  const calls = fs.existsSync(state) ? Number(fs.readFileSync(state, 'utf8')) : 0;
  const reportExists = fs.existsSync(output) && fs.statSync(output).size > 0;
  const stdout = result.stdout || '';
  const stderr = result.stderr || '';
  fs.rmSync(temp, { recursive: true, force: true });
  return { status: result.status, calls, reportExists, stdout, stderr, error: result.error };
}

test('accepts a successful Lighthouse run without retrying', () => {
  const result = runScenario('success');
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.calls, 1);
  assert.equal(result.reportExists, true);
});

test('retries the known transient Chrome startup failure and then succeeds', () => {
  const result = runScenario('transient-then-success');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.calls, 2);
  assert.equal(result.reportExists, true);
  assert.match(result.stderr, /Transient Chrome startup failure/);
});

test('does not retry unrelated Lighthouse failures', () => {
  const result = runScenario('permanent');
  assert.equal(result.status, 7);
  assert.equal(result.calls, 1);
  assert.equal(result.reportExists, false);
  assert.match(result.stderr, /non-retryable error/);
});

test('stops after three repeated Chrome startup failures', () => {
  const result = runScenario('transient-always');
  assert.equal(result.status, 1);
  assert.equal(result.calls, 3);
  assert.equal(result.reportExists, false);
  assert.match(result.stderr, /retry limit reached \(3 attempts\)/);
});
