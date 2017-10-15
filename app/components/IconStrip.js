import React, { Component, PureComponent } from 'react'
import {
  Animated,
  BackHandler,
  Dimensions,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableWithoutFeedback,
  View
} from 'react-native'
import { default as MaterialIcon } from 'react-native-vector-icons/MaterialIcons'
import { BoxShadow } from 'react-native-shadow'

const activeMenuContexts = []

function showMenu (position, children) {
  if (activeMenuContexts.length !== 1) return
  activeMenuContexts[0].showMenu(position, children)
}

class Separator extends PureComponent {
  render () {
    return (
      <View
        style={{
          borderBottomWidth: StyleSheet.hairlineWidth
        }}
      />
    )
  }
}

class MaybeBoxShadow extends PureComponent {
  constructor (props) {
    super(props)

    this.state = {
      fadeInAnim: new Animated.Value(0)
    }
    this.clonedProps = Object.assign({}, this.props)
    this.clonedProps.setting = Object.assign({}, this.props.setting)
    this.clonedProps.setting.style = Object.assign(
      {},
      this.props.setting.style,
      {
        marginVertical: 0,
        left: 0,
        top: 0
      }
    )
  }

  render () {
    if (Platform.OS == 'android') {
      let setting = this.clonedProps.setting

      return (
        <Animated.View
          style={{
            ...this.props.setting.style,
            width: setting.width,
            height: setting.height,
            transform: [{ scale: this.state.fadeInAnim }],
            opacity: this.state.fadeInAnim
          }}
        >
          <BoxShadow {...this.clonedProps} />
        </Animated.View>
      )
    } else {
      const setting = this.props.setting

      return (
        <Animated.View
          style={{
            ...this.props.setting.style,
            width: setting.width,
            height: setting.height,
            transform: [{ scale: this.state.fadeInAnim }],
            opacity: this.state.fadeInAnim,
            shadowOpacity: setting.opacity
          }}
        >
          {this.props.children}
        </Animated.View>
      )
    }
  }

  componentDidMount () {
    Animated.timing(this.state.fadeInAnim, {
      toValue: 1,
      duration: 100
    }).start()
  }
}

class DelayedTouchableHighlight extends PureComponent {
  render () {
    return (
      <TouchableHighlight
        {...this.props}
        onShowUnderlay={this.showCallback.bind(this)}
        onPress={this.pressCallback.bind(this)}
        onHideUnderlay={this.hideCallback.bind(this)}
      />
    )
  }

  showCallback () {
    this.pressed = false
  }

  pressCallback () {
    this.pressed = true
  }

  hideCallback () {
    if (this.pressed && this.props.onPress) this.props.onPress()
  }
}

class IconPushButton extends PureComponent {
  render () {
    if (this.props.disabled) {
      return (
        <MaterialIcon
          color={this.props.disabledColor}
          name={this.props.iconName}
          size={this.props.iconSize}
        />
      )
    } else {
      return (
        <TouchableHighlight
          ref='touchableHighlight'
          underlayColor={this.props.underlayColor}
          onLayout={() =>
            this.refs.touchableHighlight.measure(this.props.onPosition)}
          onPress={this.props.onPress}
        >
          <MaterialIcon
            color={this.props.color}
            name={this.props.iconName}
            size={this.props.iconSize}
          />
        </TouchableHighlight>
      )
    }
  }
}
IconPushButton.defaultProps = {
  iconSize: 1,
  color: '#000000',
  underlayColor: '#ffffff',
  disabledColor: '#808080'
}

class IconPopupItem extends Component {
  render () {
    return (
      <DelayedTouchableHighlight
        underlayColor={this.props.underlayColor}
        onPress={this.pressHandler.bind(this)}
      >
        <Text style={this.props.style}>{this.props.children}</Text>
      </DelayedTouchableHighlight>
    )
  }

  pressHandler () {
    this.props._internalPress()
    if (this.props.onPress) this.props.onPress()
  }
}
IconPopupItem.defaultProps = {
  iconSize: 1,
  underlayColor: '#ffffff'
}

class IconPopupButton extends PureComponent {
  render () {
    return (
      <IconPushButton
        {...this.props.iconSettings}
        iconName={this.props.iconName}
        onPress={this.popUp.bind(this)}
        onPosition={(x, y, w, h, px, py) => {
          /* used to position the overlay */
          this.position = { x: px, y: py }
        }}
      />
    )
  }

  popUp () {
    showMenu(this.position, {
      children: this.props.children,
      offset: { x: 35, y: -10 },
      popupItemSettings: this.props.popupItemSettings
    })
  }
}

class IconStripMenuContext extends Component {
  constructor (props) {
    super(props)

    var { width, height } = Dimensions.get('window')

    this.position = null
    this.size = { width: width, height: height }
    this.state = {
      position: null,
      menuVisible: false,
      menuProps: null,
      menuLayout: null,
      keyboardHeight: 0
    }
  }

  componentDidMount () {
    activeMenuContexts.push(this)
    this.keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      this.keyboardDidShow.bind(this)
    )
    this.keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      this.keyboardDidHide.bind(this)
    )
    this.hardwareBackPressListener = BackHandler.addEventListener(
      'hardwareBackPress',
      this.closePopupOnBack.bind(this)
    )
  }

  componentWillUnmount () {
    activeMenuContexts.splice(activeMenuContexts.indexOf(this))
    this.keyboardDidShowListener.remove()
    this.keyboardDidHideListener.remove()
    this.hardwareBackPressListener.remove()
  }

  render () {
    if (this.state.menuVisible) {
      let clickableChildren = React.Children.map(
        this.state.menuProps.children,
        child =>
          React.cloneElement(child, {
            style: mergeStyle(
              defaultStyles.popupItemStyle,
              this.state.menuProps.popupItemSettings.style,
              child.props.style
            ),
            underlayColor: this.state.menuProps.popupItemSettings.underlayColor,
            _internalPress: this.popDown.bind(this)
          })
      )
      let popupWindow = this.makePopup(clickableChildren)
      return (
        <View style={{ flex: 1 }}>
          {this.props.children}
          {/* overlay to dismiss the popup */}
          <TouchableWithoutFeedback
            onPress={this.popDown.bind(this)}
            style={{
              position: 'absolute',
              zIndex: 1,
              left: -this.position.x,
              top: -this.position.y,
              width: this.size.width,
              height: this.size.height
            }}
          >
            <View
              style={{
                position: 'absolute',
                zIndex: 1,
                top: -this.position.y,
                left: -this.position.x,
                width: this.size.width,
                height: this.size.height
              }}
            />
          </TouchableWithoutFeedback>
          {popupWindow}
        </View>
      )
    } else {
      return (
        <View
          ref='menuContext'
          style={{ flex: 1 }}
          onLayout={() => {
            this.refs.menuContext.measure((x, y, w, h, px, py) => {
              /* used to position the overlay */
              this.position = { x: px, y: py, w: w, h: h }
            })
          }}
        >
          {this.props.children}
        </View>
      )
    }
  }

  keyboardDidShow (evt) {
    this.setState({ keyboardHeight: evt.endCoordinates.height })
  }

  keyboardDidHide (evt) {
    this.setState({ keyboardHeight: 0 })
  }

  closePopupOnBack () {
    if (this.state.menuVisible) {
      this.popDown()
      return true
    }

    return false
  }

  makePopup (clickableChildren) {
    if (this.state.menuLayout == null) {
      let setLayout = ({ nativeEvent }) => {
        this.setState({
          menuLayout: {
            width: nativeEvent.layout.width,
            height: nativeEvent.layout.height
          }
        })
      }

      return (
        <View
          style={{
            position: 'absolute',
            left: this.position.w,
            top: this.position.h
          }}
          onLayout={setLayout}
        >
          {clickableChildren}
        </View>
      )
    } else {
      return this.makeActualPopup(clickableChildren)
    }
  }

  makeActualPopup (clickableChildren) {
    let radius = 3
    let { width, height } = this.state.menuLayout
    let paddedWidth = width + 2 * radius,
      paddedHeight = height + 2 * radius
    let position = this.state.position
    let offset = this.state.menuProps.offset

    return (
      <MaybeBoxShadow
        setting={{
          width: paddedWidth,
          height: paddedHeight,
          border: 2,
          radius: radius,
          opacity: 0.2,
          x: 0,
          y: 0,
          style: {
            marginVertical: 5,
            position: 'absolute',
            zIndex: 2,
            left: position.x + offset.x - paddedWidth,
            top:
              position.y + offset.y - paddedHeight - this.state.keyboardHeight
          }
        }}
      >
        <View
          style={{
            position: 'absolute',
            flexDirection: 'column',
            zIndex: 3,
            top: radius,
            left: radius,
            width: width,
            height: height,
            backgroundColor: '#ffffff'
          }}
        >
          {clickableChildren}
        </View>
      </MaybeBoxShadow>
    )
  }

  showMenu (position, menuProps) {
    this.setState({
      position: position,
      menuVisible: true,
      menuProps: menuProps,
      menuLayout: null
    })
  }

  popDown () {
    this.setState({
      position: null,
      menuVisible: false,
      menuProps: null,
      menuLayout: null
    })
  }
}

export default class IconStrip extends Component {
  render () {
    let clonedChildren = React.Children.map(
      this.props.children,
      this.propagateProps.bind(this)
    )

    return (
      <View style={{ flexDirection: 'row', ...this.props.style }}>
        <View style={{ flex: 1 /* XXX align right style */ }} />
        {clonedChildren}
      </View>
    )
  }

  propagateProps (child) {
    if (child === null) {
      return child
    } else if (child.type === IconPopupButton) {
      return React.cloneElement(child, {
        popupItemSettings: this.props.popupItemSettings,
        iconSettings: this.props.iconSettings
      })
    } else if (child.type === IconPushButton) {
      return React.cloneElement(child, this.props.iconSettings)
    } else {
      return child
    }
  }
}

let defaultStyles = StyleSheet.create({
  popupItemStyle: {
    padding: 5
  }
})
IconStrip.defaultProps = {
  popupItemSettings: {
    style: defaultStyles.popupItemStyle
  },
  iconSettings: {
    color: '#000000',
    underlayColor: '#ffffff'
  }
}

function isEmpty (obj) {
  return obj.constructor == Object && Object.keys(obj).length === 0
}

function mergeStyle () {
  let merged = null
  for (let i = 0; i < arguments.length; ++i) {
    let style = arguments[i]
    if (style === null || style === undefined || isEmpty(style)) continue
    if (merged === null) merged = []
    merged.push(style)
  }
  return merged
}

IconStrip.Separator = Separator
IconStrip.PushButton = IconPushButton
IconStrip.PopupButton = IconPopupButton
IconStrip.PopupItem = IconPopupItem
IconStrip.MenuContext = IconStripMenuContext
