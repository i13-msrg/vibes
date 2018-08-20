package com.vibes.utils

import org.joda.time.DateTime

object VConf {
  var numberOfNodes = 10
  var blockTime = 600 // seconds
  var neighboursDiscoveryInterval = 3000 // seconds
  var numberOfNeighbours = 4
  var throughPut = 10 // average number of transactions per blockTime
  var transactionSize = 250 // kb
  var simulationStart: DateTime = DateTime.now
  var simulateUntil: DateTime = DateTime.now.plusHours(3)
  var blockPropagationDelay = 900 // ms (latency + transfer + verification time)
  var transactionPropagationDelay = 150 // ms

  var strategy = "GENERIC_SIMULATION" // mb

  // variables for Bitcoin-like Simulation
  var maxBlockSize = 1000000 // b
  var maxBlockWeight = 4000000 // weight units https://en.bitcoin.it/wiki/Weight_units
  var segWitEnabled = true // https://en.bitcoin.it/wiki/Segregated_Witness
  var networkBandwidth = 1 // mb/s
  var distanceBetweenNodes = 1 // km
  var nonSegWitMaxTransactionsPerBlock = 2147483647

  // variables for Alternative History Attack
  var isAlternativeHistoryAttack = false
  var hashRate = 30 // Attacker's hash rate in percentage of total network
  var confirmations = 4 // Confirmations the attacked Merchant is waiting for

  // todo following attack parameter could be made into input parameters
  var attackDuration = 20 // attacker gives up after x blocks, in the original paper the attack duration is 20
  var discountOnStolenGoods = 1 // discount of stolen goods, 1=no discount
  var amountOfAttackedMerchants = 5 // attack carried out against k merchants
  var blockReward : Double = 12.5 // current block reward in BTC

  // todo could maybe made into local variables instead of globals
  var attackSuccessful = false
  var goodChainLength = 0
  var evilChainLength = 0
  var attackFailed = false
  var attackSuccessfulInBlocks = 0

  // SegWit
  var segWitActive = false
  var transactionWeight = 0 // transaction weight in weight units
  var segWitMaxTransactionsPerBlock = 0

  // Flood Attack
  var floodAttackTransactionFee = 0 // attacker's target transaction fee in Satoshi
  var floodAttackTransactionPool = 0 // current transaction pool size of transactions with fee bigger or equal to flood attack target transaction fee
}
