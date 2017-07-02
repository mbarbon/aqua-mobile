import React, { PureComponent } from 'react';
import {
    Platform,
    TouchableHighlight,
    TouchableNativeFeedback,
    TouchableOpacity,
} from 'react-native';

export default class BestTouchable extends PureComponent {
    render() {
        if (Platform.OS === 'android') {
            return (
              <TouchableNativeFeedback
                onPress={this.props.onPress}
                style={this.props.style}
                background={this.props.background}
                >
                {this.props.children}
              </TouchableNativeFeedback>
            );
        } else {
            return (
              <TouchableHighlight
                onPress={this.props.onPress}
                underlayColor={this.props.underlayColor}
                >
                {this.props.children}
              </TouchableHighlight>
            );
        }
    }
}
BestTouchable.SelectableBackground =
    Platform.OS === 'android' ?
        TouchableNativeFeedback.SelectableBackground :
        function () { };
