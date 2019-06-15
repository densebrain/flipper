/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import reducer from "../ConnectionsReducer"
import BaseDevice from "../../devices/BaseDevice"
import { State } from "../ConnectionsReducer"
import { stato as Models } from "@stato/models"

test("REGISTER_DEVICE doesnt remove error", () => {
  const initialState: State = reducer(undefined, {
    type: "SERVER_ERROR",
    payload: "something went wrong"
  }) // Precondition

  expect(initialState.error).toEqual("something went wrong")
  const endState = reducer(initialState, {
    type: "REGISTER_DEVICE",
    payload: new BaseDevice(Models.OS.OSAndroid,"serial", "physical", "title")
  })
  expect(endState.error).toEqual("something went wrong")
})
