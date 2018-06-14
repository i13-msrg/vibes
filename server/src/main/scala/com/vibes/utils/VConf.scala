package com.vibes.utils

import org.joda.time.DateTime

object VConf {
  var numberOfNodes = 10
  var blockTime = 600 // seconds
  var neighboursDiscoveryInterval = 3000 // seconds
  var numberOfNeighbours = 4
  var throughPut = 10 // average number of transactions per blockTime
  var transactionSize = 250 // kb
  var simulateUntil: DateTime = DateTime.now.plusHours(3)
  var blockPropagationDelay = 900 // ms (latency + transfer + verification time)
  var transactionPropagationDelay = 150 // ms

  var strategy = "GENERIC_SIMULATION" // mb

  // variables for Proof of Work
  var maxBlockSize = 1000 // kb
  var maxBlockWeight = 4000 // kb https://en.bitcoin.it/wiki/Weight_units
  var segWitEnabled = true // https://en.bitcoin.it/wiki/Segregated_Witness
  var networkBandwidth = 1 // mb/s
  var distanceBetweenNodes = 1 // km

  // variables for Alternative History Attack
  var hashrate = 30 // Attacker's hashrate in percentage of total network
  var confirmations = 4 // Confirmations the attacked Merchant is waiting for
}
