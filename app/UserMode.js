import React, { PureComponent } from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import {
    localState
} from './Globals';
import StatusBarPadding from './StatusBarPadding';
import { analyticsLogEvent } from './Firebase'
import Button from './Button'

const logoScale = 0.60; /* XXX hardcoded */

export default class UserMode extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            currentUsername: null,
        };
    }

    render() {
        return (
          <View style={styles.container}>
            <StatusBarPadding />
            <View style={{ backgroundColor: '#d9f4fb',
                           padding: 20 * logoScale }} >
              {false &&
                <Image source={require('./img/aqua-thumbsup.jpg')}
                       style={{ width: 225 * logoScale,
                                height: 225 * logoScale }}
                    />}
              <Text style={{fontSize: 160 * logoScale, color: '#484e98'}}>Aqua</Text>
              <Text style={{fontSize: 30 * logoScale, color: '#484e98'}}>Anime recommendations</Text>
            </View>
            <TextInput
              style={{ alignSelf: 'stretch',
                       margin: 5,
                       height: 40 } /* XXX hardcoded */}
              autoCapitalize='none'
              placeholder='MAL username'
              onChangeText={this.usernameChanged.bind(this)}
              />
            <Button
              style={{ margin: 5 }}
              onPress={this.setMALUsername.bind(this)}
              title="Use MAL user"
              color='#fcd382'
              disabled={!this.hasValidUsername()}
              />
            <Text
              style={{ margin: 5 }}
              >or</Text>
            <Button
              style={{ margin: 5, color: '#fcd382' }}
              onPress={this.setLocalUser.bind(this)}
              title="Add anime you liked"
              color='#fcd382'
              />
          </View>
        );
    }

    usernameChanged(username) {
        let actualUsername =
            username === undefined ||
            username === '' ? null : username;

        this.setState({
            currentUsername: actualUsername,
        });
    }

    hasValidUsername() {
        return this.state.currentUsername != null &&
            this.state.currentUsername.length >= 3;
    }

    setMALUsername() {
        analyticsLogEvent('mal_user')
        localState.setMalUsernameAndLoadRecommendations(this.state.currentUsername);
    }

    setLocalUser() {
        localState.setLocalUser();
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
