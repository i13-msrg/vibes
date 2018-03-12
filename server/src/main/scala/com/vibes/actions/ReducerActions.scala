package com.vibes.actions

import com.vibes.models.VNode

object ReducerActions {
  sealed trait Action

  case class ReceiveNode(node: VNode)
}
