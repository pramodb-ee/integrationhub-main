const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const source = fs.readFileSync('src/app/integration-setup-wizard/components/apiMapping.ts', 'utf8');
const storage = new Map();
const context = { exports: {}, localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) } };
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, context);
const { mappedPayload, mappingErrors, cappingError, saveDummyLead, readDummyLeads, deleteDummyLead } = context.exports;
const state = () => ({ mappings: [{ sourceField: 'name', destinationField: 'lead_name', enabled: true }, { sourceField: 'email', destinationField: 'email', enabled: true }], staticFields: [{ key: 'lead_status', value: 'New' }], capping: { enabled: true, requestLimit: 100, windowHours: 1, fields: [] } });

test('preview uses the selected payload and static values only', () => {
  const output = mappedPayload({ name: 'Selected Request', email: 'selected@example.com', unmapped: 'omit' }, state());
  assert.equal(JSON.stringify(output), JSON.stringify({ lead_name: 'Selected Request', email: 'selected@example.com', lead_status: 'New' }));
  assert.equal(mappingErrors(state()).length, 0);
});
test('duplicate source, destination and static mappings are rejected', () => {
  const config = state();
  config.mappings.push({ sourceField: 'name', destinationField: 'email', enabled: true });
  config.staticFields.push({ key: 'email', value: 'duplicate' });
  const errors = mappingErrors(config).join(' ');
  assert.match(errors, /Source field name/);
  assert.match(errors, /Destination field email/);
});
test('100 requests allowed, 101st blocked, window expiry restores capacity', () => {
  const config = state().capping;
  const now = 10000000;
  const requests = Array.from({ length: 99 }, () => ({ timestamp: now - 1, payload: {} }));
  assert.equal(cappingError(config, {}, requests, now), null);
  requests.push({ timestamp: now - 1, payload: {} });
  assert.match(cappingError(config, {}, requests, now), /100 requests per 1 Hour/);
  assert.equal(cappingError(config, {}, requests, now + 3600000), null);
  config.windowHours = 24;
  assert.match(cappingError(config, {}, requests, now + 3600000), /1 Day/);
  assert.equal(cappingError(config, {}, requests, now + 86400000), null);
});
test('disabled caps and unmatched conditions do not block; enabled conditions use OR', () => {
  const config = { ...state().capping, requestLimit: 1, fields: [{ key: 'lead_source', enabled: true, selectedOption: 'Facebook' }, { key: 'lead_medium', enabled: true, selectedOption: 'Email' }] };
  const requests = [{ timestamp: 9999, payload: { lead_source: 'Facebook' } }];
  assert.equal(cappingError(config, { lead_source: 'Organic' }, requests, 10000), null);
  assert.match(cappingError(config, { lead_medium: 'Email' }, requests, 10000), /blocked/);
  config.enabled = false;
  assert.equal(cappingError(config, { lead_source: 'Facebook' }, requests, 10000), null);
});
test('delete removes the same lead from shared dummy CRM storage', () => {
  saveDummyLead({ id: 'a', integrationId: 'one' });
  saveDummyLead({ id: 'b', integrationId: 'two' });
  deleteDummyLead('a');
  assert.equal(readDummyLeads().length, 1);
  assert.equal(readDummyLeads()[0].id, 'b');
});
