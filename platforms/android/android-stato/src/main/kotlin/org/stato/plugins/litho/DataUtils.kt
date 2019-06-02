package org.stato.plugins.litho



import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.Drawable
import org.stato.core.StatoObject
import org.stato.plugins.inspector.InspectorValue
import org.stato.plugins.inspector.Named
import com.facebook.litho.StateContainer
import com.facebook.litho.annotations.Prop
import com.facebook.litho.annotations.ResType.*
import com.facebook.litho.annotations.State
import org.stato.plugins.inspector.InspectorValue.Type

object DataUtils {

  @Throws(Exception::class)
  internal fun getPropData(node: Any): List<Named<StatoObject>> {
    val props = StatoObject.Builder()
    val data = mutableListOf<Named<StatoObject>>()

    var hasProps = false

    for (f in node.javaClass.declaredFields) {
      f.isAccessible = true

      val annotation = f.getAnnotation(Prop::class.java)
      if (annotation != null) {
        if (f.get(node) != null && PropWithInspectorSection::class.java.isAssignableFrom(f.get(node).javaClass)) {
          val datum = (f.get(node) as PropWithInspectorSection?)?.statoLayoutInspectorSection
          if (datum != null) {
            data.add(Named(datum.key, StatoObject(datum.value)))
          }
        }

        when (annotation.resType) {
          COLOR -> props.put(f.name, fromColor((f.get(node) as Int).toInt()))
          DRAWABLE -> props.put(f.name, fromDrawable(f.get(node) as Drawable))
          else -> if (f.get(node) != null && PropWithDescription::class.java.isAssignableFrom(f.get(node).javaClass)) {
            val description = (f.get(node) as PropWithDescription).statoLayoutInspectorPropDescription
            // Treat the description as immutable for now, because it's a "translation" of the
            // actual prop,
            // mutating them is not going to change the original prop.
            if (description is Map<*, *>) {
              val descriptionMap = description as Map<*, *>
              for (entry in descriptionMap.entries) {
                props.put(entry.key.toString(), InspectorValue.immutable(entry.value ?: continue))
              }
            } else {
              props.put(f.name, InspectorValue.immutable(description))
            }
          } else {
            if (isTypeMutable(f.type)) {
              props.put(f.name, InspectorValue.mutable(f.get(node)))
            } else {
              props.put(f.name, InspectorValue.immutable(f.get(node)))
            }
          }
        }
        hasProps = true
      }
    }

    if (hasProps) {
      data.add(Named("Props", props.build()))
    }

    return data
  }


  @Throws(Exception::class)
  internal fun getStateData(node: Any, stateContainer: StateContainer?): StatoObject? {
    if (stateContainer == null) {
      return null
    }

    val state = StatoObject.Builder()

    var hasState = false
    for (f in stateContainer.javaClass.declaredFields) {
      f.isAccessible = true

      val annotation = f.getAnnotation(State::class.java)
      if (annotation != null) {
        if (isTypeMutable(f.type)) {
          state.put(f.name, InspectorValue.mutable(f.get(stateContainer)))
        } else {
          state.put(f.name, InspectorValue.immutable(f.get(stateContainer)))
        }
        hasState = true
      }
    }

    return if (hasState) state.build() else null
  }

  private fun isTypeMutable(type: Class<*>): Boolean {
    return when(type) {
      Int::class.javaPrimitiveType, Integer::class.java -> true
      Long::class.javaPrimitiveType, Long::class.java -> true
      Float::class.javaPrimitiveType ,Float::class.java -> true
      Double::class.javaPrimitiveType,Double::class.java -> true
      Boolean::class.javaPrimitiveType,Boolean::class.java -> true
      else -> type.isAssignableFrom(String::class.java)
    }
  }

  internal fun fromDrawable(d: Drawable?): InspectorValue<Int> {
    return if (d is ColorDrawable) {
      InspectorValue.mutable(
        Type.Color, d.color)
    } else InspectorValue.mutable(Type.Color, 0)
  }

  private fun fromColor(color: Int?): InspectorValue<Int> {
    return InspectorValue.mutable(Type.Color, color ?: 0)
  }
}
