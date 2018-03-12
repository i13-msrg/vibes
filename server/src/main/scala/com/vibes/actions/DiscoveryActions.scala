package com.vibes.actions

import com.vibes.models.VNode

object DiscoveryActions {
  sealed trait Action

  case class ReceiveNode(node: VNode) extends Action
  case object AnnounceNeighbours      extends Action
}
