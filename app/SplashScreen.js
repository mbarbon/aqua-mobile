import React, { PureComponent } from 'react';
import {
    StyleSheet,
    View,
} from 'react-native';

export default class SplashScreen extends PureComponent {
    render() {
        return (
          <View style={styles.container} />
        );
    }
}

// XXX move to top level?
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
});
