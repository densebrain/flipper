/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import {DeviceLogEntry} from "@states/core"
import {LogTable} from "@states/plugin-logs"

require('electron').remote.getCurrentWindow().show();

//import {addEntriesToState, processEntry} from '../index';

const entry = {
  tag: 'OpenGLRenderer',
  pid: 18384,

  tid: 18409,
  message: 'Swap behavior 1',
  date: new Date('Feb 28 2013 19:00:00 EST'),
  type: 'debug',
} as DeviceLogEntry;

test('processEntry', () => {
  const key = 'key';
  const processedEntry = LogTable.processEntry({} as any, entry, key);
  expect(processedEntry.entry).toEqual(entry);
  expect(processedEntry.row.key).toBe(key);
  expect(typeof processedEntry.row.height).toBe('number');
});

test('addEntriesToState without current state', () => {
  const processedEntry = LogTable.processEntry({} as any, entry, 'key');
  const
    state = LogTable.createState(),
    newState = LogTable.addEntriesToState([processedEntry], state, null);

  expect(newState.pages.length).toBe(1);
  expect(newState.records.length).toBe(1);
  expect(newState.records[0].entry).toEqual(processedEntry);
});

test('addEntriesToState with current state', () => {
  const state = LogTable.createState()
  const currentState = LogTable.addEntriesToState([LogTable.processEntry(state, entry, 'key1')], state, null);
  const processedEntry = LogTable.processEntry(state,
    {
      ...entry,
      message: 'new message',
    },
    'key2',
  );
  const newState = LogTable.addEntriesToState([processedEntry], currentState, null);
  expect(newState.pages.length).toBe(1);
  expect(newState.pages[0].size).toBe(2);
  expect(newState.records.length).toBe(2);
});

test('addEntriesToState increase counter on duplicate message', () => {
  const state = LogTable.createState()
  const currentState = LogTable.addEntriesToState([LogTable.processEntry(state, entry, 'key1')], state);
  const processedEntry = LogTable.processEntry({...state,...currentState}, entry, 'key2');
  const newState = LogTable.addEntriesToState([processedEntry], {...state,...currentState});
  expect(newState.pages.length).toBe(1)
  expect(newState.pages[0].size).toBe(1)
  expect(newState.records.length).toBe(2)
});
