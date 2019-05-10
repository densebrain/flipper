/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import FlexColumn from "./FlexColumn"
import styled from "../styled/index"
import Orderable from "./Orderable"
import FlexRow from "./FlexRow"
import { colors } from "../themes/colors"
import Tab from "./Tab"
const TabList = styled(FlexRow)({
  alignItems: "stretch"
})
const TabListItem = styled("div")(props => ({
  backgroundColor: props.active ? colors.light15 : colors.light02,
  borderBottom: "1px solid #dddfe2",
  boxShadow: props.active ? "inset 0px 0px 3px rgba(0,0,0,0.25)" : "none",
  color: colors.dark80,
  flex: 1,
  fontSize: 13,
  lineHeight: "28px",
  overflow: "hidden",
  padding: "0 10px",
  position: "relative",
  textAlign: "center",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  "&:hover": {
    backgroundColor: props.active ? colors.light15 : colors.light05
  }
}))
const TabListAddItem = styled(TabListItem)({
  borderRight: "none",
  flex: 0,
  flexGrow: 0,
  fontWeight: "bold"
})
const CloseButton = styled("div")({
  color: "#000",
  float: "right",
  fontSize: 10,
  fontWeight: "bold",
  textAlign: "center",
  marginLeft: 6,
  marginTop: 6,
  width: 16,
  height: 16,
  lineHeight: "16px",
  borderRadius: "50%",
  "&:hover": {
    backgroundColor: colors.cherry,
    color: "#fff"
  }
})
const OrderableContainer = styled("div")({
  display: "inline-block"
})
const TabContent = styled("div")({
  height: "100%",
  overflow: "auto",
  width: "100%"
})
/**
 * A Tabs component.
 */

export default function Tabs(props: {
  onActive?: (key: string | null | undefined) => void,
  defaultActive?: string,
  active?: string | null | undefined,
  children?: Array<React$Element<any>>,
  orderable?: boolean,
  onOrder?: (order: Array<string>) => void,
  order?: Array<string>,
  persist?: boolean,
  newable?: boolean,
  onNew?: () => void,
  before?: Array<React.ReactNode>,
  after?: Array<React.ReactNode>
}) {
  const { onActive } = props
  const active: string | null | undefined = props.active == null ? props.defaultActive : props.active // array of other components that aren't tabs

  const before = props.before || []
  const after = props.after || [] //

  const tabs = {} // a list of keys

  const keys = props.order ? props.order.slice() : []
  const tabContents = []
  const tabSiblings = []

  function add(comps) {
    for (const comp of [].concat(comps || [])) {
      if (Array.isArray(comp)) {
        add(comp)
        continue
      }

      if (!comp) {
        continue
      }

      if (comp.type !== Tab) {
        // if element isn't a tab then just push it into the tab list
        tabSiblings.push(comp)
        continue
      }

      const { children, closable, label, onClose, width } = comp.props
      const key = comp.key == null ? label : comp.key

      if (typeof key !== "string") {
        throw new Error("tab needs a string key or a label")
      }

      if (!keys.includes(key)) {
        keys.push(key)
      }

      const isActive: boolean = active === key

      if (isActive || props.persist === true || comp.props.persist === true) {
        tabContents.push(
          <TabContent key={key} hidden={!isActive}>
            {children}
          </TabContent>
        )
      } // this tab has been hidden from the tab bar but can still be selected if its key is active

      if (comp.props.hidden) {
        continue
      }

      let closeButton
      tabs[key] = (
        <TabListItem
          key={key}
          width={width}
          active={isActive}
          onMouseDown={
            !isActive &&
            onActive &&
            ((event: SyntheticMouseEvent<>) => {
              if (event.target !== closeButton) {
                onActive(key)
              }
            })
          }
        >
          {comp.props.label}
          {closable && (
            <CloseButton // eslint-disable-next-line react/jsx-no-bind
              innerRef={ref => (closeButton = ref)} // eslint-disable-next-line react/jsx-no-bind
              onMouseDown={() => {
                if (isActive && onActive) {
                  const index = keys.indexOf(key)
                  const newActive = keys[index + 1] || keys[index - 1] || null
                  onActive(newActive)
                }

                onClose()
              }}
            >
              X
            </CloseButton>
          )}
        </TabListItem>
      )
    }
  }

  add(props.children)
  let tabList

  if (props.orderable === true) {
    tabList = (
      <OrderableContainer key="orderable-list">
        <Orderable orientation="horizontal" items={tabs} onChange={props.onOrder} order={keys} />
      </OrderableContainer>
    )
  } else {
    tabList = []

    for (const key in tabs) {
      tabList.push(tabs[key])
    }
  }

  if (props.newable === true) {
    after.push(
      <TabListAddItem key={keys.length} onMouseDown={props.onNew}>
        +
      </TabListAddItem>
    )
  }

  return (
    <FlexColumn grow={true}>
      <TabList>
        {before}
        {tabList}
        {after}
      </TabList>
      {tabContents}
      {tabSiblings}
    </FlexColumn>
  )
}
