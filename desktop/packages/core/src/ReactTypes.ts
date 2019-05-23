import * as React from "react"
//import {Omit} from "@material-ui/core"

export type PropInjector<InjectedProps, AdditionalProps = {}> = <
  C extends React.ComponentType<InjectedProps & AdditionalProps>
  >(
  component: C,
) => React.ComponentType<
  Omit<AdditionalProps, keyof InjectedProps> & AdditionalProps
  >;
