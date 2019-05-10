import filterProps from 'react-valid-props'
export default function BaseView(props:React.HTMLProps) {
  const {classes} = (props: any);
  
  return <div {
    ...{
      ...filterProps(props),
      ...(classes && classes.root ? {className: classes?.root} : {})
    }
  }/>
}
