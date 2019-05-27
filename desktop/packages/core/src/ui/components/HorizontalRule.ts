/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */

import styled from "../styled/index"
import {Theme} from "../themes"
export default styled("div")(({colors}: Theme) =>({
  backgroundColor: colors.textLight,
  height: 1,
  margin: "5px 0"
}))