package com.vibes.actors

import akka.actor.{Actor, ActorRef, Props}
import akka.util.Timeout
import com.vibes.actions.{DiscoveryActions, NodeActions}
import com.vibes.models.VNode
import scala.concurrent.ExecutionContext.Implicits.global

import scala.concurrent.duration._
import scala.util.Random

class DiscoveryActor(numberOfNeighbours: Int) extends Actor {
  private var currentNodes: List[VNode] = List.empty
  implicit private val timeout: Timeout = Timeout(20.seconds)

  override def preStart(): Unit = {
    println(s"DisoveryActor started ${self.path}")
  }

  override def receive: Receive = {
    case DiscoveryActions.AnnounceNeighbours =>
      DiscoveryActor.announceNeighbours(currentNodes, numberOfNeighbours)

    case DiscoveryActions.ReceiveNode(node) =>
      currentNodes = DiscoveryActor.updateCurrentNodes(currentNodes, node)
  }
}

object DiscoveryActor {
  def props(numberOfNeighbours: Int): Props = Props(new DiscoveryActor(numberOfNeighbours))

  def announceNeighbours(currentNodes: List[VNode], numberOfNeighbours: Int): Unit = {
    println("Update neighbours table...")
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
