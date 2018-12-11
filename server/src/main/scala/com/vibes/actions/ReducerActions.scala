package com.vibes.actions

import com.vibes.models.{VBlock, VNode}

object ReducerActions {
  sealed trait Action

  case class ReceiveNode(node: VNode)
  case class AddBlock(block: VBlock)
}
