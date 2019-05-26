package com.facebook.states.nativeplugins;

import com.facebook.states.core.StatesPlugin;

/**
 * Subclass of {@link StatesPlugin} for mobile-defined plugins that conform to a template.
 * Implementations should call {@link #RawNativePlugin(String, String)} to specify which template
 * will be used. See {@link com.facebook.states.nativeplugins.table.TablePlugin} for an example
 * subclass.
 */
public abstract class RawNativePlugin implements StatesPlugin {
  private final String pluginType;
  private final String id;

  /**
   * Call super() inside subclass constructors to provide the template name and id of the concrete
   * plugin instance.
   *
   * @param pluginType This needs to correspond to a plugin template defined in States.
   * @param id This will uniquely
   */
  public RawNativePlugin(final String pluginType, final String id) {
    this.pluginType = pluginType;
    this.id = id;
  }

  @Override
  public final String getId() {
    return "_nativeplugin_" + pluginType + "_" + id;
  }
}
