//import type {React.ReactElement} from 'react';
//import {React.ReactElement} from 'react'
import * as React from 'react'
import {HTMLAttributes} from 'react'
import hoistNonReactStatics from 'hoist-non-react-statics'
import {Theme, ThemedClassNames, withStyles, WithStylesOptions} from '../themes'
import {StyledElement, StyleMakerFn, StylerFnOrStyles} from './StyleTypes'

import filterProps from 'react-valid-props'
import {memoFn} from '../../utils/memoize'
//import {React.ReactElement} from 'react';
//import type {} from '@material-ui/core/styles/withStyles';

const { getDisplayName } = require('@material-ui/utils');

function omit<I extends any = any, F extends keyof I = any, O extends FilterTypes<I, F> = FilterTypes<I, F>>(input:I, fields:Array<F & string>):O {
  const output: O = {} as any;
  Object.keys(input).forEach((prop:string & F) => {
    if (fields.indexOf(prop) === -1) {
      output[prop] = input[prop];
    }
  });
  return output;
} // styled-components's API removes the mapping between components and styles.
// Using components as a low-level styling construct can be simpler.
//((style:StylerFnOrStyles<Props>, options: ?WithStylesOptions) => React.Element<Props>)

export type AllStyledProps<Props> = HTMLAttributes<any> & Props & {
  classes?: ThemedClassNames<"root">
  clone?: boolean | undefined
  component?: React.ReactNode | string | undefined
  innerRef?: React.Ref<any> | React.RefObject<any>
}

function styled<Props = any, State = {}, AllProps extends AllStyledProps<Props> = AllStyledProps<Props>, ComponentType extends StyledElement<AllProps> | React.ComponentClass<Props,State> = StyledElement<AllProps>>(
  Component: ComponentType, componentName: string | null | undefined = null
) {
  return (style: StylerFnOrStyles<AllProps> | StyleMakerFn<AllProps>, options: WithStylesOptions | null | undefined = null) => {
    const StyledComponent: any = React.forwardRef<ComponentType, AllProps>((props, ref) => {
      // render() {
      const {
        children,
        classes,
        className: classNameProp,
        clone,
        component: ComponentProp,
        ...other
      } = props; //other = _objectWithoutPropertiesLoose(this.props, ["children", "classes", "className", "clone", "component","innerRef"]);

      if (options && options.forwardInnerRef === true) {
        other.innerRef = ref;
        ref = null;
      }

      const className = `${classes.root} ${classNameProp}`;

      if (clone && children) {
        
        return React.cloneElement(children as any, {
          className: `${(children as any).props.className} ${className}`,
          ...(ref ? {
            ref
          } : {})
        });
      }

      let spread = other;
      
      const {filterProps:customFilterProps} = style as StyleMakerFn<typeof spread>
      if (customFilterProps) {
        spread = omit<typeof spread,any>(spread, customFilterProps);
      }

      if (typeof children === 'function') {
        return children({
          className,
          ...spread,
          ...(ref ? {
            ref
          } : {})
        });
      }

      const FinalComponent = (ComponentProp || Component) as ComponentType,
            UnfilteredProps = { ...spread },
            AllProps = typeof FinalComponent === 'string' ? filterProps(UnfilteredProps) : UnfilteredProps; // noinspection JSUnresolvedFunction

      return React.createElement(FinalComponent as any, { ...AllProps,
        className,
        ...(ref ? {
          ref
        } : {})
      }, children);
    });
    // process.env.NODE_ENV !== 'production' ? StyledComponent.propTypes = {
    //   /**
    //    * A render function or node.
    //    */
    //   children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    //   classes: PropTypes.object.isRequired,
    //   className: PropTypes.string,
    //
    //   /**
    //    * If `true`, the component will recycle it's children DOM element.
    //    * It's using `React.cloneElement` internally.
    //    */
    //   clone: chainPropTypes(PropTypes.bool, (props: AllProps) => {
    //     if (props.clone && props.component) {
    //       throw new Error('You can not use the clone and component properties at the same time.');
    //     }
    //   }),
    //   innerRef: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
    //
    //   /**
    //    * The component used for the root node.
    //    * Either a string to use a DOM element or a component.
    //    */
    //   component: PropTypes.oneOfType([PropTypes.string, PropTypes.func, PropTypes.object]),
    //   theme: PropTypes.object,
    //   ...(style.propTypes || {}),
    //   ...(Component.propTypes || {})
    // } : void 0;

    if (process.env.NODE_ENV !== 'production') {
      StyledComponent.displayName = componentName || `Styled(${getDisplayName(Component)})`;
    }

    const styles = typeof style === 'function' ? memoFn((theme: Theme) => ({
      root: (props: AllProps) => style({
        theme,
        ...props
      })
    })) : {
      root: style
    };
    hoistNonReactStatics(StyledComponent, Component as any); //return React.memo((withStyles((styles: any), options || {}): any)(StyledComponent));

    return (withStyles((styles as any), options || {}) as any)(StyledComponent);
  };
}

export default styled;
