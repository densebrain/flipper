/**
 * Copyright 2019-present Densebrain.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Copyright 2019-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */

const fbjs = require("eslint-config-fbjs")

// enforces copyright header and @format directive to be present in every file
//const pattern = /^\*\n \* Copyright 20\d{2}-present Densebrain\.\n \* This source code is licensed under the MIT license found in the\n \* LICENSE file in the root directory of this source tree\.\n \*\n \* Copyright 20\d{2}-present Facebook\.\n \* This source code is licensed under the MIT license found in the\n \* LICENSE file in the root directory of this source tree\.\n \* @format\n/
//const template = "*\n * Copyright 2019-present Densebrain.\n * This source code is licensed under the MIT license found in the\n * LICENSE file in the root directory of this source tree.\n *\n * Copyright 2019-present Facebook.\n * This source code is licensed under the MIT license found in the\n * LICENSE file in the root directory of this source tree.\n * @format\n"
const template = [
  "*",
  " * Copyright 2019-present Densebrain.",
  " * This source code is licensed under the MIT license found in the",
  " * LICENSE file in the root directory of this source tree.",
  " *",
  " * Copyright 2019-present Facebook.",
  " * This source code is licensed under the MIT license found in the",
  " * LICENSE file in the root directory of this source tree.",
  " * @format",
  " "
]
module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: [...fbjs.plugins, "header", "prettier"],
  extends: [
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended", // Uses the recommended rules from the @typescript-eslint/eslint-plugin
    "prettier/@typescript-eslint"
  ],
  parserOptions: {
    ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
    sourceType: "module", // Allows for the use of imports
    ecmaFeatures: {
      jsx: true // Allows for the parsing of JSX
    }
  },
  rules: {
    "react/no-find-dom-node": 0,
    "@typescript-eslint/no-non-null-assertion": 0,
    "@typescript-eslint/no-use-before-define": 0,
    "@typescript-eslint/no-object-literal-type-assertion": 0,
    "@typescript-eslint/no-explicit-any": 0,
    "@typescript-eslint/explicit-function-return-type": 0,
    "@typescript-eslint/explicit-member-accessibility": 0,
    "@typescript-eslint/no-var-requires": 0,
    "@typescript-eslint/no-namespace": 0,
    "@typescript-eslint/array-type": 0,
    "@typescript-eslint/prefer-interface": 0,
    "react/react-in-jsx-scope": 0, // not needed with our metro implementation
    "no-new": 0, // new keyword needed e.g. new Notification
    "no-catch-shadow": 0, // only relevant for IE8 and below
    "no-bitwise": 0, // bitwise operations needed in some places
    "consistent-return": 0,
    "max-len": 0, // let"s take prettier take care of this
    indent: 0, // let"s take prettier take care of this
    "no-console": 0, // we"re setting window.console in App.js
    "no-undef": 0,
    "no-array-constructor": 0,
    "comma-dangle": 0,

    // eslint-disable-next-line
    semi: ["warn", "never"],
    quotes: ["warn", "double"],

    // additional rules for this project
    "header/header": [2, "block", template],
    "prettier/prettier": [2, require("./.prettierrc.js")]
  },
  settings: {
    react: {
      version: "detect" // Tells eslint-plugin-react to automatically detect the version of React to use
    }
  }
}
