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

import * as React from "react"
import * as Octicons from "@githubprimer/octicons-react"
import * as MUIIcons from "@material-ui/icons"
import * as FALightIcons from "@fortawesome/pro-light-svg-icons"
import * as FACore from "@fortawesome/fontawesome-svg-core"
import * as FASolidIcons from "@fortawesome/pro-solid-svg-icons"
import { withStyles, Theme, ThemeProps } from "../themes"
import { HTMLAttributes } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

FACore.library.add(FALightIcons.fal, FASolidIcons.fas)

export enum IconType {
  Octicon = "Octicon",
  MUI = "MUI",
  FALight = "FALight",
  FASolid = "FASolid"
}

export type IconKey<
  Type extends IconType = IconType
> = Type extends IconType.Octicon
  ? keyof typeof Octicons
  : Type extends IconType.MUI
  ? keyof typeof MUIIcons
  : Type extends IconType.FALight
  ? FALightIcons.IconName
  : Type extends IconType.FASolid
  ? FASolidIcons.IconName
  : never

export interface IconMeta<Type extends IconType = IconType> {
  type: Type
  key: IconKey<Type>
}

export function makeFALightIcon(
  key: IconKey<IconType.FALight>
): IconMeta<IconType.FALight> {
  return {
    type: IconType.FALight,
    key
  }
}

export function makeFASolidIcon(
  key: IconKey<IconType.FASolid>
): IconMeta<IconType.FASolid> {
  return {
    type: IconType.FASolid,
    key
  }
}

export function makeOcticonIcon(
  key: IconKey<IconType.Octicon>
): IconMeta<IconType.Octicon> {
  return {
    type: IconType.Octicon,
    key
  }
}

export function makeMUIIcon(
  key: IconKey<IconType.MUI>
): IconMeta<IconType.MUI> {
  return {
    type: IconType.MUI,
    key
  }
}

export interface IconProps extends HTMLAttributes<any> {
  meta?: IconMeta
  key?: IconKey
  type?: IconType
}

export const Icon = withStyles((_theme: Theme) => {})(
  (props: ThemeProps<IconProps, "root">) => {
    let { meta, key, type, ...others } = props

    if (!meta) {
      if (!key || !type)
        throw new Error(
          "If `meta` is not provided then both `key` and `type` are required"
        )
      meta = { key, type }
    }

    ;({ key, type } = meta)

    if (type === IconType.MUI) {
      const Component = (MUIIcons as any)[key] as any
      return <Component {...others} />
    } else if (type === IconType.Octicon) {
      const Component = Octicons.default as any
      return <Component icon={(Octicons as any)[key as any]} {...others} />
    } else if ([IconType.FALight, IconType.FASolid].includes(type)) {
      const icon = Object.values(
        type === IconType.FALight ? FALightIcons.fal : FASolidIcons.fas
      ).find(icon => icon.iconName === key)
      return <FontAwesomeIcon icon={icon} {...others} />
    } else {
      throw new Error("Unknown icon type")
    }
  }
)
