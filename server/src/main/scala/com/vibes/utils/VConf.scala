package com.vibes.utils

import org.joda.time.DateTime

object VConf {
  var numberOfNodes               = 10
  var blockTime                   = 600 // seconds
  var neighboursDiscoveryInterval = 3000 // seconds
  var numberOfNeighbours          = 4
  var throughPut                  = 10 // average number of transactions per blockTime
  var transactionSize             = 250 // kb
  var propagationDelay            = 900 // ms (latency + transfer + verification time)
  var simulateUntil: DateTime     = DateTime.now.plusHours(3)
}
