/// <reference path="./globalStateDeclaration.d.ts" />

export const state: PrescriptGlobalState = {}

Object.assign(global, {
  prescriptState: state
})
