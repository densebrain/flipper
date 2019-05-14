/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import * as React from "react"
import {TitleBarNaked} from "../TitleBar"
import renderer from "react-test-renderer"
import reducers from "../../reducers/index"
const configureStore =require("redux-mock-store").default
import { Provider } from "react-redux"
const mockStore = configureStore([])(
  reducers(undefined, {
    type: "INIT"
  })
)
test("TitleBar is rendered", () => {
  const component = renderer.create(
    <Provider store={mockStore}>
      <TitleBarNaked
        windowIsFocused={true}
        leftSidebarVisible={false}
        rightSidebarVisible={false}
        rightSidebarAvailable={false}
        downloadingImportData={false}
        toggleLeftSidebarVisible={() => {}}
        toggleRightSidebarVisible={() => {}}
        setActiveSheet={() => {}}
        version="1.0.0"
        launcherMsg={{
          message: "Hello world",
          severity: "warning"
        }}
      />
    </Provider>
  )
  expect(component.toJSON()).toMatchSnapshot()
})
