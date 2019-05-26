/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */

test("dummy", () => {
  expect(1).toEqual(1)
})
// import { createTablePlugin } from "../createTablePlugin"
// import { StatesPlugin } from "../plugin"
// const KNOWN_METADATA_PROPS = {
//   method: "method",
//   resetMethod: "resetMethod",
//   columns: {},
//   columnSizes: {},
//   renderSidebar: () => {},
//   buildRow: () => {
//     return {
//       columns: {},
//       key: "someKey"
//     }
//   }
// }
// const DYNAMIC_METADATA_PROPS = {
//   method: "method",
//   resetMethod: "resetMethod",
//   id: "testytest",
//   title: "TestPlugin",
//   renderSidebar: () => {},
//   buildRow: () => {
//     return {
//       columns: {},
//       key: "someKey"
//     }
//   }
// }
// test("createTablePlugin returns StatesPlugin", () => {
//   const tablePlugin = createTablePlugin({ ...KNOWN_METADATA_PROPS })
//   expect(tablePlugin.prototype).toBeInstanceOf(StatesPlugin)
// })
// test("persistedStateReducer is resetting data", () => {
//   const resetMethod = "resetMethod"
//   const tablePlugin = createTablePlugin({ ...KNOWN_METADATA_PROPS, resetMethod })
//   const ps = {
//     datas: {
//       "1": {
//         id: "1",
//         rowNumber: 0
//       }
//     },
//     rows: [
//       {
//         key: "1",
//         columns: {
//           id: {
//             value: "1"
//           }
//         }
//       }
//     ],
//     tableMetadata: null
//   }
//
//   if (!tablePlugin.persistedStateReducer) {
//     expect(tablePlugin.persistedStateReducer).toBeDefined()
//     return
//   }
//
//   const { rows, datas } = tablePlugin.persistedStateReducer(ps, resetMethod, {})
//   expect(datas).toEqual({})
//   expect(rows).toEqual([])
// })
// test("persistedStateReducer is adding data", () => {
//   const method = "method"
//   const tablePlugin = createTablePlugin({ ...KNOWN_METADATA_PROPS, method })
//   const id = "1"
//   const ps = {
//     datas: {},
//     rows: [],
//     tableMetadata: null
//   }
//
//   if (!tablePlugin.persistedStateReducer) {
//     expect(tablePlugin.persistedStateReducer).toBeDefined()
//     return
//   }
//
//   const { rows, datas } = tablePlugin.persistedStateReducer(ps, method, {
//     id
//   })
//   expect(rows.length).toBe(1)
//   expect(Object.keys(datas)).toEqual([id])
// })
// test("dyn persistedStateReducer is adding data", () => {
//   const method = "method"
//   const tablePlugin = createTablePlugin({ ...DYNAMIC_METADATA_PROPS, method })
//   const id = "1"
//   const ps = {
//     datas: {},
//     rows: [],
//     tableMetadata: null
//   }
//
//   if (!tablePlugin.persistedStateReducer) {
//     expect(tablePlugin.persistedStateReducer).toBeDefined()
//     return
//   }
//
//   const { rows, datas } = tablePlugin.persistedStateReducer(ps, method, {
//     id,
//     columns: {}
//   })
//   expect(rows.length).toBe(1)
//   expect(Object.keys(datas)).toEqual([id])
// })
