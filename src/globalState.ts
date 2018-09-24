/// <reference path="./globalStateDeclaration.ts" />

export const state: PrescriptGlobalState = {}

Object.assign(global, {
  prescriptState: state
})
