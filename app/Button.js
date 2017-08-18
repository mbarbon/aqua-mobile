import React, { PureComponent } from 'react';
import {
    TouchableHighlight,
    Text,
    View,
} from 'react-native';

const disabledColors = {
    border: '#a0a0a0',
    background: '#e0e0e0',
    text: '#a0a0a0',
};

const normalColors = {
    border: '#d6b36f',
    background: '#fcd382',
    text: '#705e3b',
};

export default class Button extends PureComponent {
    constructor(props) {
        super(props);

    }

    render() {
        let { border, background, text } =
            this.props.disabled ? disabledColors : normalColors;

        return (
          <TouchableHighlight
            onPress={this.props.disabled ? null : this.props.onPress} >
            <View
              style={{ backgroundColor: border }}
              padding={1} >
              <View
                style={{ backgroundColor: background }}
                padding={5}
                paddingLeft={20}
                paddingRight={20}>
                <Text style={{ color: text,
                               fontSize: 15 }}>
                  {this.props.title}
                </Text>
              </View>
            </View>
          </TouchableHighlight>
        );
    }
}
