package com.vibes.utils

import org.joda.time.DateTime

object VConf {
  /**
    * 0 for Generic Blockchain Simulation
    * 1 for Proof of Stake
    * 2 for Proof of Work
    * 3 for Hyperledger
    */
  var typeOfSimulation = 0

  var numberOfNodes = 10
  var blockTime = 600 // seconds
  var neighboursDiscoveryInterval = 3000 // seconds
  var numberOfNeighbours = 4
  var throughPut = 10 // average number of transactions per blockTime
  var transactionSize = 250 // kb
  var simulateUntil: DateTime = DateTime.now.plusHours(3)
  var propagationDelay = 900 // ms (latency + transfer + verification time)

  // variables for Proof of Work
  var blockSize = 1 // mb
  var networkBandwidth = 1 // mb/s
  var distanceBetweenNodes = 1 // km
}
