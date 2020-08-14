class NullReportingInterface implements IReportingInterface {
  addAttachment = () => null
}

export interface IReportingInterface {
  addAttachment: (name: string, buf: Buffer, mimeType: string) => void
}

export default {
  currentReportingInterface: new NullReportingInterface() as IReportingInterface
}
