import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { root } from '../tools/lib/project.js';

const dockerfile = readFileSync(path.join(root, 'deploy/Dockerfile'), 'utf8');
const containerDoc = readFileSync(path.join(root, 'docs/container.md'), 'utf8');

test('the core image pins its base, tooling Node, and apt snapshot', () => {
  assert.match(dockerfile, /FROM ubuntu:24\.04@sha256:534baea6a22c03a63003dbc8dbe78fe34bc0d7e595d9a9dc9834884ff530eb55/);
  assert.match(dockerfile, /NODE_TOOLING_SHA256=00bbd05e306ea68b6e13e17360d0e2f680b493ef95f2fea1c4296ff7437530bc/);
  assert.match(dockerfile, /sha256sum -c -/);
  assert.match(dockerfile, /APT_SNAPSHOT=20261001T000000Z/);
  assert.match(dockerfile, /ca-certificates=20260601~24\.04\.1/);
  assert.match(dockerfile, /libavdevice60=7:6\.1\.1-3ubuntu5/);
  assert.match(containerDoc, /input reproducibility/);
  assert.match(containerDoc, /not bit-for-bit OCI/);
});
