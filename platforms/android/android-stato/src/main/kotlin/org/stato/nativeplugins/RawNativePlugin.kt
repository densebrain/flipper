package org.stato.nativeplugins

import org.stato.core.StatoPlugin

/**
 * Subclass of [StatoPlugin] for mobile-defined plugins that conform to a template.
 * Implementations should call [.RawNativePlugin] to specify which template
 * will be used. See [org.stato.nativeplugins.table.TablePlugin] for an example
 * subclass.
 */
abstract class RawNativePlugin(private val pluginType: String, private val nativeId: String) : StatoPlugin {
/**
 * Call super() inside subclass constructors to provide the template name and id of the concrete
 * plugin instance.
 *
 * @param pluginType This needs to correspond to a plugin template defined in Stato.
 * @param id This will uniquely
 */


    override val id= "_nativeplugin_${pluginType}_${nativeId}"

}
