package com.vibes.actors

import akka.actor.{Actor, ActorRef, Props}
import akka.util.Timeout
import com.typesafe.scalalogging.LazyLogging
import com.vibes.actions.{DiscoveryActions, NodeActions}
import com.vibes.models.VNode
import scala.concurrent.duration._
import scala.util.Random

/*
* The DiscoveryActor updates Nodes’ neighbour tables on regular intervals, based on
* the configuration parameter - neighbourDiscoveryInterval. The DiscoveryActor simply
* dispatches a message to each Node with a new set of randomly chosen neighbours every
* neighbourDiscoveryInterval seconds. I believe there is no specific algorithm or heuristic
* behind the neighbour discovery in a blockchain based network, but even if there is - it
* is easy to exchange the current randomized one since the DiscoveryActor is the central
* authority there. Why don’t Nodes update their own tables instead of being managed by
* another Actor? Because I wanted to offload work from them firstly, and secondly, it is
* now very easy to exchange discovery implementation.
*/
class DiscoveryActor(numberOfNeighbours: Int) extends Actor with LazyLogging {
  private var currentNodes: List[VNode] = List.empty
  implicit private val timeout: Timeout = Timeout(20.seconds)

  override def preStart(): Unit = {
    println(s"DisoveryActor started ${self.path}")
    logger.debug(s"DisoveryActor started ${self.path}")
  }

  override def receive: Receive = {
    case DiscoveryActions.AnnounceNeighbours =>
      DiscoveryActor.announceNeighbours(currentNodes, numberOfNeighbours)

    case DiscoveryActions.ReceiveNode(node) =>
      currentNodes = DiscoveryActor.updateCurrentNodes(currentNodes, node)
  }
}

object DiscoveryActor extends LazyLogging {
  def props(numberOfNeighbours: Int): Props = Props(new DiscoveryActor(numberOfNeighbours))

  def announceNeighbours(currentNodes: List[VNode], numberOfNeighbours: Int): Unit = {
    logger.debug("Update neighbours table...")
    currentNodes.foreach(node =>
      node.actor ! NodeActions.ReceiveNeighbours(discoverNeighbours(currentNodes, node, numberOfNeighbours)))
  }

  def discoverNeighbours(currentNodes: List[VNode], node: VNode, numberOfNeighbours: Int): Set[ActorRef] = {
    val nodes = currentNodes.filter(_ != node)
    Random.shuffle(nodes).take(numberOfNeighbours).map(_.actor).toSet
  }

  def updateCurrentNodes(currentNodes: List[VNode], node: VNode): List[VNode] = {
    if (!currentNodes.exists(_.id == node.id)) {
      return node :: currentNodes
    }

    currentNodes.map(
      currentNode =>
        if (currentNode.id == node.id && node.blockchain.size > currentNode.blockchain.size) node
        else currentNode)
  }
}
