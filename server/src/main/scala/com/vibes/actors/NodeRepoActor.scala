package com.vibes.actors

import akka.actor.{Actor, ActorRef, Props}
import akka.util.Timeout
import com.typesafe.scalalogging.LazyLogging
import com.vibes.actions._
import com.vibes.utils.VConf
import scala.concurrent.duration._

/*
* This actor is simply a helper to offload work from the Coordinator. The NodeRepoActor
* serves as a repository for all Nodes in the network and occasionally broadcasts messages
* addressed to all of them such as: AnnounceSimulationStart and AnnounceSimulationEnd.
* More importantly, this Actor takes care to register or instantiate all Nodes in the network
* with coordinates on land surface only. To achieve land-only instantiation, we have created
* a list of rectangles represented by lat, lng coordinates on the world’s map that are only
* within land surface and whenever we generate a Node, we pick a rectangle and randomly
* instantiate the node within the coordinates of the rectangle.
* A good opportunity for future work is to enable configuration of Nodes’ distribution on
* the world map, as explained in VIBES Chapter 6.
*/
class NodeRepoActor(discoveryActor: ActorRef, reducerActor: ActorRef) extends Actor with LazyLogging{
  implicit val timeout: Timeout = Timeout(20.seconds)
  private var registeredNodeActors: Set[ActorRef] = Set.empty

  override def preStart(): Unit = {
    logger.debug(s"NodeRegistryActor started ${self.path}")
  }

  override def receive: Receive = {
    case NodeRepoActions.RegisterNode =>
      var isEvil: Option[Boolean] = None
      if (VConf.isAlternativeHistoryAttack && (registeredNodeActors.size < VConf.hashrate.toDouble / 100 * VConf.numberOfNodes)) {
        logger.debug(s"REGISTER EVIL NODE....... ${registeredNodeActors.size}")
        isEvil = Some(true)
      } else if (VConf.isAlternativeHistoryAttack) {
        logger.debug(s"REGISTER NODE....... ${registeredNodeActors.size}")
        isEvil = Some(false)
      } else {
        logger.debug(s"REGISTER NODE....... ${registeredNodeActors.size}")
      }
      val coordinates = NodeRepoActor.createCoordinatesOnLand()
      val actor = context.actorOf(
        NodeActor.props(context.parent, self, discoveryActor, reducerActor, coordinates._1, coordinates._2, isEvil))
      registeredNodeActors += actor

    case NodeRepoActions.AnnounceStart(now) =>
      logger.debug("NodeRepoActions.AnnounceStart")
      registeredNodeActors.foreach(_ ! NodeActions.StartSimulation(now))

    case NodeRepoActions.AnnounceNextWorkRequestOnly =>
      registeredNodeActors.foreach(_ ! NodeActions.CastNextWorkRequestOnly)

    case NodeRepoActions.AnnounceNextWorkRequestAndMine(timestamp) =>
      registeredNodeActors.foreach(_ ! NodeActions.CastNextWorkRequestAndMine(timestamp, sender()))

    case NodeRepoActions.AnnounceEnd =>
      registeredNodeActors.foreach(_ ! NodeActions.End)
  }
}

object NodeRepoActor {
  private val coordinateLimits = List(
    // Some coordinates exist multiple times to increase their probability.

    // North America
    Coordinate(60, 68, -140, -120),
    Coordinate(51, 61, -127, -99),
    Coordinate(52, 57, -127, -95),
    Coordinate(45, 53, -118, -88),
    Coordinate(32, 43, -108, -88),
    Coordinate(44, 50, -76, -63),
    // South America
    Coordinate(-10, 2, -76, -53),
    Coordinate(-14, -4, -73, -42),
    Coordinate(-25, -14, -64, -50),
    Coordinate(-30, -25, -69, -53),
    // Africa
    Coordinate(17, 27, -9, 12),
    Coordinate(7, 17, -9, 12),
    Coordinate(17, 27, 12, 32),
    Coordinate(7, 17, 12, 32),
    Coordinate(-8, 1, 17, 36),
    Coordinate(-23, -14, 17, 32),
    // Europe
    Coordinate(46, 52, 10, 32),
    Coordinate(44, 48, 1, 10),
    Coordinate(60, 64, 25, 32),
    Coordinate(59, 62, 8, 15),
    Coordinate(44, 48, 1, 10),
    Coordinate(59, 62, 8, 15),
    // Australia
    Coordinate(-31, -19, 125, 144),
    Coordinate(-31, -19, 125, 144),
    Coordinate(-31, -19, 125, 144),
    // Asia
    Coordinate(42, 64, 53, 112),
    Coordinate(42, 64, 53, 112),
    Coordinate(42, 64, 53, 112),
    Coordinate(42, 64, 53, 112),
    Coordinate(58, 71, 85, 131),
    Coordinate(58, 71, 85, 131),
    Coordinate(58, 71, 85, 131),
    Coordinate(58, 71, 85, 131),
    Coordinate(61, 68, 142, 163),
    Coordinate(61, 68, 142, 163)
  )

  def randomBetween(start: Int, end: Int): Int = {
    start + scala.util.Random.nextInt(Math.abs(end - start) + 1)
  }

  def createCoordinatesOnLand(): (Double, Double) = {
    val coordinate = coordinateLimits(randomBetween(0, coordinateLimits.size - 1))
    (randomBetween(coordinate.latStart, coordinate.latEnd), randomBetween(coordinate.lngStart, coordinate.lngEnd))
  }

  def props(
             discoveryActor: ActorRef,
             reducerActor: ActorRef
           ): Props = Props(new NodeRepoActor(discoveryActor, reducerActor))
}

case class Coordinate(latStart: Int, latEnd: Int, lngStart: Int, lngEnd: Int)
