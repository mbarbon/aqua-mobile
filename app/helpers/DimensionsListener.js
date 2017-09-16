import React, { Component } from 'react'
import { Dimensions } from 'react-native'

export default class DimensdionsListener extends Component {
  componentWillReceiveProps (nextProps) {
    Dimensions.removeEventListener('change', this.props.onChange)
    Dimensions.addEventListener('change', nextProps.onChange)
  }

  componentWillMount () {
    Dimensions.addEventListener('change', this.props.onChange)
  }

  componentWillUnmount () {
    Dimensions.removeEventListener('change', this.props.onChange)
  }

  shouldComponentUpdate () {
    return false
  }

  render () {
    return null
  }
}
