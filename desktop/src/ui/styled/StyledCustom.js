//import type {React$Element} from 'react';
//import {React$Element} from 'react'
import classNames from 'classnames';
import PropTypes from 'prop-types';
import {chainPropTypes, getDisplayName} from '@material-ui/utils';
import hoistNonReactStatics from 'hoist-non-react-statics';
import type {WithStylesOptions} from '../themes/withStylesAndTheme';
import {withStyles} from '../themes/withStylesAndTheme';
import type {StyledElement, StylerFnOrStyles} from './StyleTypes';
import filterProps from 'react-valid-props';
import {memoFn} from '../../utils/memoize';

//import {React$Element} from 'react';
//import type {} from '@material-ui/core/styles/withStyles';



function omit(input, fields) {
  const output = {};
  Object.keys(input).forEach(prop => {
    if (fields.indexOf(prop) === -1) {
      output[prop] = input[prop];
    }
  });
  return output;
} // styled-components's API removes the mapping between components and styles.
// Using components as a low-level styling construct can be simpler.


//((style:StylerFnOrStyles<Props>, options: ?WithStylesOptions) => React.Element<Props>)
function styled<Props : any>(Component: StyledElement<Props>, componentName: ?string = null) {
  return (style: StylerFnOrStyles<Props>, options: ?WithStylesOptions = null) => {
    const StyledComponent: any = React.forwardRef((props, ref) => {
      
      // render() {
      const {
        children,
        classes,
        className: classNameProp,
        clone,
        component: ComponentProp,
        ...other
      } = props;
      //other = _objectWithoutPropertiesLoose(this.props, ["children", "classes", "className", "clone", "component","innerRef"]);
      
      if (options && options.forwardInnerRef === true) {
        other.innerRef = ref;
        ref = null;
      }
      
      const className = `${classes.root} ${classNameProp}`;
      
      if (clone) {
        return React.cloneElement(children, {
          className: `${children.props.className} ${className}`,
          ...(ref ? {ref} : {}),
        });
      }
      
      let spread = other;
      
      if (style.filterProps) {
        const omittedProps = style.filterProps;
        spread = omit(spread, omittedProps);
      }
      
      if (typeof children === 'function') {
        return children({
          className,
          ...spread,
          ...(ref ? {ref} : {}),
        });
      }
      
      const
        FinalComponent = ComponentProp || Component,
        UnfilteredProps = {
          ...spread,
        },
        AllProps = typeof FinalComponent === 'string' ? filterProps(UnfilteredProps) : UnfilteredProps;
      
      // noinspection JSUnresolvedFunction
      return React.createElement(FinalComponent, {...AllProps, className, ...(ref ? {ref} : {})}, children);
    });
    
    process.env.NODE_ENV !== 'production' ? StyledComponent.propTypes = {
      /**
       * A render function or node.
       */
      children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
      classes: PropTypes.object.isRequired,
      className: PropTypes.string,
      
      /**
       * If `true`, the component will recycle it's children DOM element.
       * It's using `React.cloneElement` internally.
       */
      clone: chainPropTypes(PropTypes.bool, props => {
        if (props.clone && props.component) {
          throw new Error('You can not use the clone and component properties at the same time.');
        }
      }),
      
      innerRef: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
      /**
       * The component used for the root node.
       * Either a string to use a DOM element or a component.
       */
      component: PropTypes.oneOfType([PropTypes.string, PropTypes.func, PropTypes.object]),
      theme: PropTypes.object,
      ...(style.propTypes || {}),
      ...(Component.propTypes || {}),
    } : void 0;
    
    if (process.env.NODE_ENV !== 'production') {
      StyledComponent.displayName = componentName || `Styled(${getDisplayName(Component)})`;
    }
    
    const styles = typeof style === 'function' ? memoFn(theme => ({
      root: props => style({
        theme,
        ...props,
      }),
    })) : {
      root: style,
    };
    hoistNonReactStatics(StyledComponent, Component);
    //return React.memo((withStyles((styles: any), options || {}): any)(StyledComponent));
    return (withStyles((styles: any), options || {}): any)(StyledComponent);
  };
  
}

export default styled;
