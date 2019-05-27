import {ManagedTableDataPage} from "@stato/core"
import {LogRecord, PageSize} from "./LogTypes"

export class LogRecordsPage extends ManagedTableDataPage<LogRecord> {
  static counter = 0
  
  constructor(...records: Array<LogRecord>) {
    super(`page-${LogRecordsPage.counter++}`, ...records)
  }
  
  getItemHeight(item: LogRecord) {
    return item.row.height || 0
  }
  
  getTableRow(item: LogRecord) {
    return item.row
  }
  
  getMaxItemsPerPage() {
    return PageSize
  }
}
 //type LogLevel = 'verbose' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';


