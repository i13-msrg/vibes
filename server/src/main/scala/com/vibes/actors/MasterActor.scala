package com.vibes.actors

import akka.actor.{Actor, ActorRef, Props}
import akka.util.Timeout
import com.typesafe.scalalogging.LazyLogging
import com.vibes.actions._
import com.vibes.utils.{VConf, VExecution}
import org.joda.time._
import scala.collection.immutable.SortedSet
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Promise
import scala.concurrent.duration._
import scala.util.Random

/**
  * This class represents the coordinator that controls the nodes and the execution order in the network.
  *
  * Currently there are assumptions that this actor makes. Also assumptions that the node actors make about this actor
  * which leads to unnecessary coupling and a couple of WTFs, but this is all for performance reasons.
  * For instance, to be able to utilize parallelism the MasterActor could fast forward multiple PropagateTransactions
  * aka give permission to multiple nodes to fast forward their propagation executables for transactions
  * because the order in which they are propagated does not matter as long as there is no other executable between them.
  * Meaning that sequential executables of type PropagateTransactions are simply executed in parallel.
  * Which means recipients of transaction might not be ordered by the timestamp, but the node will always receive
  * all due to transactions for a block / mempool within a correct time
  * TL:DR; We achieve parallelism by allowing transactions within a single block to be arbitrary reordered
  * Multiple actors are able to propagate multiple transactions between each other w/o asking for permission from the
  * MasterActor each time, because it already has issued them, multiple ones, as permitted.
  * Note that in the original bitcoin implementation a similar type of anarchy exists. If there is no solution
  * to the current block the node could change the order of transactions as it it suits him to start looking for a new
  * nonce / solution.
  *
  * The implications are whenever nodes need to mine a block, the MasterActor ensures all transactions are completed
  * that are permitted, empties all workRequests and queries all nodes for a new workRequest so it can get back the
  * system to a synchronized state.
  *
  * An alternative, cleaner solution, that I've tried in the beginning was the following:
  * Reset all the workRequests after an execution has taken place and ask all nodes for their workRequests once again
  * However, the MasterActor becomes the bottleneck because only 1 actor at a time can execute an operation,
  * while blocking all others. The current solution blocks only in particular cases, therefore is much faster,
  * but messier.
  */
class MasterActor extends Actor with LazyLogging{
  implicit val timeout: Timeout = Timeout(20.seconds)

  /**
    * NodeActors ask for work permission and MasterActors issues them, so that they can fast forward.
    * Only issue a permission once all currentNodeActors have voted.
    */
  private var workRequests: SortedSet[VExecution.WorkRequest] = SortedSet.empty

  /**
    * This is a simple, but not robust solution to solve following problems: MasterActor must have reference to all
    * currentNodeActors to distribute work and also make sure they have casted their work requests.
    * Note: A better solution would be for them to register / deregister themselves via messages, but I did not bother
    * doing it in a prototype. So instead once an Actor votes, it is added to the set of currentNodeActors until
    * VConf.numberOfNodes has been reached.
    */
  private var currentNodeActors: Set[ActorRef]         = Set.empty
  private var numberOfWorkRequests: Map[ActorRef, Int] = Map.empty

  /**
    * Makes sure to update neighbours table at roughly lastNeighbourDiscoveryDate time intervals
    */
  private var lastNeighbourDiscoveryDate = DateTime.now

  /**
    * Returns final result of computation to be delivered to the client. Note that here the ask ? pattern should
    * be used instead of Promise, because this solution would break for different JVMs communicating between
    * each other, cause currently I use reference to the promise. Instead, the sender should be passed around
    * combined with the ask pattern.
    */
  private var currentPromise = Promise[ReducerIntermediateResult]()

  /**
    * Injected Actors that are children of the MasterActor. Again, they should register themselves via messaging
    * instead, and proper error handling should be implemented if intended to use in a distributed setting
    */
  val discoveryActor: ActorRef =
    context.actorOf(DiscoveryActor.props(VConf.numberOfNeighbours), "Discovery")
  val reducerActor: ActorRef =
    context.actorOf(ReducerActor.props(self), "Reducer")
  val nodeRepoActor: ActorRef =
    context.actorOf(NodeRepoActor.props(discoveryActor, reducerActor), "NodeRepo")

  /**
    * Delegate work to NodeRepo to register NodeActors
    */
  (1 to VConf.numberOfNodes).foreach(_ => nodeRepoActor ! NodeRepoActions.RegisterNode)

  override def preStart(): Unit = {
    logger.debug(s"MasterActor started ${self.path}")
  }

  override def receive: Receive = {
    case MasterActions.Start =>
      /**
        * Again, since strictly message-based communication would be much more involved, for the prototype I just
        * assume that every NodeActor would be alive after X seconds and let the DiscoveryActor Announce the neighbours
        * and start
        */
      context.system.scheduler.scheduleOnce(3000.millisecond) {
        discoveryActor ! DiscoveryActions.AnnounceNeighbours
      }

      context.system.scheduler.scheduleOnce(7000.millisecond) {
        nodeRepoActor ! NodeRepoActions.AnnounceStart(DateTime.now)
      }

      sender ! currentPromise

    case MasterActions.FinishEvents(events) =>
      logger.debug("FINISH EVENTS...")
      currentPromise.success(events)

    case MasterActions.CastWorkRequest(workRequest) =>
      /**
        * because some nodes receive the right to workRequest more than once (for instance if we fast forward multiple
        * transactions that are being sent to the same node / actor, he'll workRequest multiple times. We're only interested
        * in the last workRequest he submitted, because then we know at the time of the last submission his execution queue
        * was complete
        */
      numberOfWorkRequests.get(workRequest.fromActor) match {
        // discard all workRequests but the last one
        case Some(int) if int > 0 =>
          numberOfWorkRequests += (workRequest.fromActor -> (int - 1))
        case _ =>
          // the last workRequest goes on
          currentNodeActors += workRequest.fromActor
          // assert no workRequest should be received more than once
          assert(!workRequests.contains(workRequest), "no workRequest should be received more than once")
          workRequests += workRequest

          // have all workRequests been collected?
          if (workRequests.size == VConf.numberOfNodes) {
            // number of actors that requested work should be the same of number of nodes (aka each requested work once)
            assert(currentNodeActors.size == VConf.numberOfNodes, "number of actors that requested work should be the same of number of nodes (aka each requested work once")
            // assert each requested work once, checked in an alternative way
            assert(workRequests.map(_.fromActor).toSet.size == workRequests.size, "each requested work once, checked in an alternative way")

            // Do neighbour discovery / update neighbour tables
            // this is a convenient, but not 100% correct place to execute this type of functionality
            val priorityWorkRequest = workRequests.head
            if (new org.joda.time.Duration(lastNeighbourDiscoveryDate, priorityWorkRequest.timestamp)
                  .isLongerThan(
                    new org.joda.time.Duration(
                      lastNeighbourDiscoveryDate,
                      lastNeighbourDiscoveryDate.plusSeconds(VConf.neighboursDiscoveryInterval))
                  )) {
              lastNeighbourDiscoveryDate = priorityWorkRequest.timestamp
              discoveryActor ! DiscoveryActions.AnnounceNeighbours
            }

            // if simulation over, announce end
            if (VConf.simulateUntil.isBefore(priorityWorkRequest.timestamp)) {
              nodeRepoActor ! NodeRepoActions.AnnounceEnd
            } else if (priorityWorkRequest.executionType == VExecution.ExecutionType.MineBlock) {
              // if mining of a block should be performed,
              // first of all distribute the throughPut of transactions to the nodes for the next
              // interval of mining
              currentNodeActors = Random.shuffle(currentNodeActors)
              val actorsVector = currentNodeActors.toVector
              // distribute randomly requests to NodeActors to create throughput number of transactions within blockTime
              (1 to VConf.throughPut).foreach { index =>
                val randomActorFrom = actorsVector(Random.nextInt(actorsVector.size))
                val randomActorTo   = actorsVector(Random.nextInt(actorsVector.size))
                val now             = priorityWorkRequest.timestamp
                randomActorFrom ! NodeActions.IssueTransaction(
                  randomActorTo,
                  // this means that within the blockTime the throughPut number of transactions will be issued
                  // by the nodes. Note that block could be mined in less or more than blockTime, therefore this only
                  // ensures average number of transactions per mined block and exact number of transactions per
                  // blockTime
                  now.plusMillis(VConf.blockTime * 1000 / (index + 1))
                )
              }

              // clear all workRequests
              workRequests = SortedSet.empty
              // let the first actor mine the block
              // in this executable it would also AnnounceNextWorkRequestAndMine to other actors
              priorityWorkRequest.fromActor ! NodeActions.ProcessNextExecutable(priorityWorkRequest)
            } else if (priorityWorkRequest.executionType == VExecution.ExecutionType.PropagateTransaction) {
              // if propagate transaction as execution type, then collect the workRequests until
              // ExecutionType.PropagateTransaction is in the pipeline and forward all of them and give permission
              // to nodes to execute them. Nodes that are executing them will most likely be receiving transactions
              // from other nodes as well, so we'll need to figure out how many times a node will be voting which
              // is done via numberOfWorkRequests.
              // Imagine A1 transfer transaction to A2, but A2 also needs to transfer transaction and after that
              // propagate a block. Imagine now A2 transfers transaction and workRequests with propagate block. Later
              // A2 receives the transaction from A1 and now has in the queue on top of propagate block propagate
              // transaction. Luckily, A2's first workRequest will have been discarded because of numberOfWorkRequests > 1
              // and now A2 will be able to correctly workRequest with the most recent peace of executable on top
              // (which is propagate transaction)
              var propagateWorkRequests: List[VExecution.WorkRequest] =
                List.empty
              while (workRequests.nonEmpty && workRequests.head.executionType == VExecution.ExecutionType.PropagateTransaction) {
                propagateWorkRequests ::= workRequests.head
                workRequests = workRequests.tail
              }

              // remove all actors that requested work that are going to receive something, cause they should request work again
              workRequests = workRequests.filter(
                workRequest =>
                  !propagateWorkRequests
                    .map(_.toActor)
                    .contains(workRequest.fromActor))

              // figure out how many workRequests we'll receive from each actor so that we can discard all of them but
              // the last one
              numberOfWorkRequests = Map.empty
              propagateWorkRequests.foreach { workRequest =>
                numberOfWorkRequests.get(workRequest.toActor) match {
                  case Some(int) =>
                    numberOfWorkRequests += (workRequest.toActor -> (int + 1))
                  case _ => numberOfWorkRequests += (workRequest.toActor -> 0)
                }

                numberOfWorkRequests.get(workRequest.fromActor) match {
                  case Some(int) =>
                    numberOfWorkRequests += (workRequest.fromActor -> (int + 1))
                  case _ => numberOfWorkRequests += (workRequest.fromActor -> 0)
                }
              }

              propagateWorkRequests.foreach(workRequest =>
                workRequest.fromActor ! NodeActions.ProcessNextExecutable(priorityWorkRequest))

            } else {
              // if it's anything else such as propagate a block, just execute it by 1 single actor
              // this happens rarely in comparison to transactions so no need for extra performance boost here
              // simply block the whole system, let the 2 actors involved in block propagation do their work
              // and carry on
              // The "from" actor will propagate the block and then cast a new workRequest, the receiving actor
              // will receive the block and in ReceiveBlock cast a new workRequest as well
              workRequests = workRequests.tail
              workRequests = workRequests.filter(_.fromActor != priorityWorkRequest.toActor)
              priorityWorkRequest.fromActor ! NodeActions.ProcessNextExecutable(priorityWorkRequest)
            }
          }
      }
  }
}

object MasterActor {
  def props(): Props = Props(new MasterActor())
}
