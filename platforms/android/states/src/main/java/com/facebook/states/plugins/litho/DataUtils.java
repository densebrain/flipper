package com.facebook.states.plugins.litho;

import static com.facebook.states.plugins.inspector.InspectorValue.Type.Color;

import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import com.facebook.states.core.StatesObject;
import com.facebook.states.plugins.inspector.InspectorValue;
import com.facebook.states.plugins.inspector.Named;
import com.facebook.litho.StateContainer;
import com.facebook.litho.annotations.Prop;
import com.facebook.litho.annotations.State;
import java.lang.reflect.Field;
import java.util.AbstractMap;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import javax.annotation.Nullable;

public class DataUtils {

  @Nullable
  static List<com.facebook.states.plugins.inspector.Named<com.facebook.states.core.StatesObject>>
      getPropData(Object node) throws Exception {
    final StatesObject.Builder props = new StatesObject.Builder();
    List<Named<StatesObject>> data = new ArrayList<>();

    boolean hasProps = false;

    for (Field f : node.getClass().getDeclaredFields()) {
      f.setAccessible(true);

      final Prop annotation = f.getAnnotation(Prop.class);
      if (annotation != null) {
        if (f.get(node) != null
            && PropWithInspectorSection.class.isAssignableFrom(f.get(node).getClass())) {
          final AbstractMap.SimpleEntry<String, String> datum =
              ((PropWithInspectorSection) f.get(node)).getStatesLayoutInspectorSection();
          if (datum != null) {
            data.add(new Named<>(datum.getKey(), new StatesObject(datum.getValue())));
          }
        }

        switch (annotation.resType()) {
          case COLOR:
            props.put(f.getName(), fromColor((Integer) f.get(node)));
            break;
          case DRAWABLE:
            props.put(f.getName(), fromDrawable((Drawable) f.get(node)));
            break;
          default:
            if (f.get(node) != null
                && PropWithDescription.class.isAssignableFrom(f.get(node).getClass())) {
              final Object description =
                  ((PropWithDescription) f.get(node)).getStatesLayoutInspectorPropDescription();
              // Treat the description as immutable for now, because it's a "translation" of the
              // actual prop,
              // mutating them is not going to change the original prop.
              if (description instanceof Map<?, ?>) {
                final Map<?, ?> descriptionMap = (Map<?, ?>) description;
                for (Map.Entry<?, ?> entry : descriptionMap.entrySet()) {
                  props.put(entry.getKey().toString(), InspectorValue.immutable(entry.getValue()));
                }
              } else {
                props.put(f.getName(), InspectorValue.immutable(description));
              }
            } else {
              if (isTypeMutable(f.getType())) {
                props.put(f.getName(), InspectorValue.mutable(f.get(node)));
              } else {
                props.put(f.getName(), InspectorValue.immutable(f.get(node)));
              }
            }
            break;
        }
        hasProps = true;
      }
    }

    if (hasProps) {
      data.add(new Named<>("Props", props.build()));
    }

    return data;
  }

  @Nullable
  static StatesObject getStateData(Object node, StateContainer stateContainer) throws Exception {
    if (stateContainer == null) {
      return null;
    }

    final StatesObject.Builder state = new StatesObject.Builder();

    boolean hasState = false;
    for (Field f : stateContainer.getClass().getDeclaredFields()) {
      f.setAccessible(true);

      final State annotation = f.getAnnotation(State.class);
      if (annotation != null) {
        if (DataUtils.isTypeMutable(f.getType())) {
          state.put(f.getName(), InspectorValue.mutable(f.get(stateContainer)));
        } else {
          state.put(f.getName(), InspectorValue.immutable(f.get(stateContainer)));
        }
        hasState = true;
      }
    }

    return hasState ? state.build() : null;
  }

  static boolean isTypeMutable(Class<?> type) {
    if (type == int.class || type == Integer.class) {
      return true;
    } else if (type == long.class || type == Long.class) {
      return true;
    } else if (type == float.class || type == Float.class) {
      return true;
    } else if (type == double.class || type == Double.class) {
      return true;
    } else if (type == boolean.class || type == Boolean.class) {
      return true;
    } else if (type.isAssignableFrom(String.class)) {
      return true;
    }
    return false;
  }

  static com.facebook.states.plugins.inspector.InspectorValue fromDrawable(Drawable d) {
    if (d instanceof ColorDrawable) {
      return com.facebook.states.plugins.inspector.InspectorValue.mutable(
          Color, ((ColorDrawable) d).getColor());
    }
    return com.facebook.states.plugins.inspector.InspectorValue.mutable(Color, 0);
  }

  static com.facebook.states.plugins.inspector.InspectorValue fromColor(int color) {
    return com.facebook.states.plugins.inspector.InspectorValue.mutable(Color, color);
  }
}
