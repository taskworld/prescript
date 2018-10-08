/// <reference path="./globalStateDeclaration.ts" />

export const state: Prescript.GlobalState = {}

Object.assign(global, {
  prescriptState: state
})
