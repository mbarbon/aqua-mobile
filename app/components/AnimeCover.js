// @flow
import React, { PureComponent } from 'react'
import { Animated, Image, StyleSheet, View } from 'react-native'

const forScreenshot = false
const coverImage = require('../img/cover-loading.png')
const coverWidth = 84
const coberHeight = 114

type Props = {
  uri: string
}

type State = {
  coverSize: Animated.Value,
  placeholderSize: Animated.Value,
  stage: number
}

export default class AnimeCover extends PureComponent<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      coverSize: new Animated.Value(0),
      placeholderSize: new Animated.Value(0),
      stage: 0
    }
  }

  loadingComplete () {
    if (this.state.stage >= 2) {
      return
    }
    this.toStage(2)
    Animated.parallel([
      Animated.timing(this.state.coverSize, {
        toValue: 1,
        duration: 300
      }),
      Animated.timing(this.state.placeholderSize, {
        toValue: 0,
        duration: 300
      })
    ]).start(() => this.toStage(3))
  }

  componentDidMount () {
    Animated.timing(this.state.placeholderSize, {
      toValue: 1,
      duration: 30
    }).start(() => this.toStage(1))
  }

  toStage (stage: number) {
    this.setState(state => {
      return { stage: Math.max(stage, state.stage) }
    })
  }

  componentWillUnmount () {
    this.state.placeholderSize.stopAnimation()
    this.state.coverSize.stopAnimation()
  }

  render () {
    if (forScreenshot) {
      return <Image style={styles.cover} source={coverImage} />
    }
    let coverStyle = null,
      placeholderStyle = null
    if (this.state.stage >= 2) {
      coverStyle = {
        position: 'absolute',
        width: coverWidth,
        height: coberHeight,
        resizeMode: 'contain',
        transform: [{ scale: this.state.coverSize }]
      }
    }
    if (this.state.stage !== 3) {
      placeholderStyle = {
        width: coverWidth,
        height: coberHeight,
        resizeMode: 'contain',
        transform: [{ scale: this.state.placeholderSize }]
      }
    }

    return (
      <View style={styles.container}>
        {this.state.stage !== 3 && (
          <Animated.Image
            key='loading'
            source={coverImage}
            style={placeholderStyle}
          />
        )}
        <Animated.Image
          key='cover'
          style={this.state.stage < 2 ? styles.loadingCover : coverStyle}
          onLoad={this.loadingComplete.bind(this)}
          source={{
            uri: this.props.uri,
            cache: 'default'
          }}
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    width: coverWidth,
    height: coberHeight
  },
  loadingCover: {
    width: 1,
    height: 1
  },
  cover: {
    width: coverWidth,
    height: coberHeight,
    resizeMode: 'contain'
  }
})
