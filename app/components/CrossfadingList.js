import React, { PureComponent } from 'react'
import { Animated, FlatList, View } from 'react-native'

class CrossfadingListItem extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      fadeInAnimation: new Animated.Value(0),
      fadeOutAnimation: new Animated.Value(1),
      previousView: null
    }
  }

  render () {
    if (
      this.state.previousView &&
      this.state.previousView !== this.state.viee
    ) {
      return (
        <View>
          <Animated.View
            key='currentView'
            style={{
              opacity: this.state.fadeInAnimation
            }}
          >
            {this.props.view}
          </Animated.View>
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              opacity: this.state.fadeOutAnimation
            }}
          >
            {this.state.previousView}
          </Animated.View>
        </View>
      )
    } else {
      return (
        <View>
          <Animated.View key='currentView'>{this.props.view}</Animated.View>
        </View>
      )
    }
  }

  componentWillReceiveProps (nextProps) {
    if (this.props.itemKey !== nextProps.itemKey) {
      this.setState({ previousView: this.props.view })
      Animated.parallel([
        Animated.timing(this.state.fadeInAnimation, {
          toValue: 1,
          duration: this.props.fadeDuration,
          useNativeDriver: true
        }),
        Animated.timing(this.state.fadeOutAnimation, {
          toValue: 0,
          duration: this.props.fadeDuration,
          useNativeDriver: true
        })
      ]).start(this.fadingComplete.bind(this))
    }
  }

  fadingComplete () {
    this.setState({ previousView: null })
    this.state.fadeInAnimation.setValue(0)
    this.state.fadeOutAnimation.setValue(1)
  }
}

export default class CrossfadingList extends PureComponent {
  static defaultProps = {
    fadeDuration: 200
  }

  constructor (props) {
    super(props)
    this.views = {}
    this.renderItemCallback = this.renderItem.bind(this)
    this.viewableItemsCallback = this.viewableItems.bind(this)
  }

  viewableItems ({ viewableItems }) {
    let views = {}
    for (let { isViewable, key } of viewableItems) {
      views[key] = this.views[key] || null
    }
    this.views = views
  }

  renderItem ({ item, index, separators }) {
    let view = this.props.renderItem({ item, index, separators })
    let itemKey = this.props.keyExtractor(item, index)
    let currentView = this.views[index]

    return (
      <CrossfadingListItem
        view={view}
        itemKey={itemKey}
        fadeDuration={this.props.fadeDuration}
      />
    )
  }

  render () {
    return (
      <FlatList
        {...this.props}
        renderItem={this.renderItemCallback}
        onViewableItemsChanged={this.viewableItemsCallback}
        keyExtractor={CrossfadingList.keyExtractor}
      />
    )
  }

  static keyExtractor (item, index) {
    return index
  }
}
