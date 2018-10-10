import * as singletonApi from '../src/singletonApi'
import { IPrescriptAPI } from '../src/types'

type PublicAPI = Pick<
  typeof singletonApi,
  Exclude<keyof typeof singletonApi, 'default'>
>

// This asserts that the internal IPrescriptAPI is kept in sync with PublicAPI
let x: PublicAPI = (null as any) as IPrescriptAPI
void x
