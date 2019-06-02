package org.stato.core

interface StatoClientFactory {

  fun getClient(): StatoClient
}