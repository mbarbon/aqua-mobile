import React, { PureComponent } from 'react';
import {
    Platform,
    View,
} from 'react-native';

export default class StatusBarPadding extends PureComponent {
    render() {
        if (Platform.OS == 'ios') {
            return (
              <View
                style={{ height: 20,
                         backgroundColor: this.props.backgroundColor }}
                />
            );
        } else {
            return null;
        }
    }
}
