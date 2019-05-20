import {setConfig} from "react-hot-loader"

setConfig({
  logLevel: 'debug',
  pureSFC: true,
  pureRender: true,
  // onComponentRegister: (type, name, file) =>
  //   (String(type).indexOf('useState') > 0 ||  String(type).indexOf('useEffect') > 0) && cold(type)
})
