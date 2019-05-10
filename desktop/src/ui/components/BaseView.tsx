import * as React from 'react'
import filterProps from 'react-valid-props';

export default function BaseView(props: React.HTMLAttributes<any>) {
  const {
    classes
  } = (props as any);
  return <div {...{ ...filterProps(props),
    ...(classes && classes.root ? {
      className: classes.root
    } : {})
  }} />;
}
