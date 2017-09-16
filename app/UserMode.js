import React, { PureComponent } from 'react'
import {
  Image,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native'
import { localState } from './state/Globals'
import StatusBarPadding from './components/StatusBarPadding'
import { analyticsLogEvent } from './helpers/Firebase'
import Button from './components/Button'

const logoScale = 0.6 /* XXX hardcoded */

export default class UserMode extends PureComponent {
  constructor (props) {
    super(props)

    this.state = {
      currentUsername: null
    }
  }

  render () {
    return (
      <KeyboardAvoidingView style={styles.container} behavior='padding'>
        <StatusBarPadding backgroundColor='#ffffff' />
        <View
          style={{
            backgroundColor: '#d9f4fb',
            padding: 20 * logoScale
          }}
        >
          {true && (
            <Image
              source={require('./img/splash.png')}
              style={{
                width: 225 * logoScale / 0.6,
                height: 225 * logoScale / 0.6
              }}
            />
          )}
          {false && (
            <Text style={{ fontSize: 160 * logoScale, color: '#484e98' }}>
              Aqua
            </Text>
          )}
          {false && (
            <Text style={{ fontSize: 30 * logoScale, color: '#484e98' }}>
              Anime recommendations
            </Text>
          )}
        </View>
        <TextInput
          style={{
            alignSelf: 'center',
            margin: 5,
            marginLeft: 30,
            marginRight: 30,
            width: 225,
            height: 40
          } /* XXX hardcoded */}
          autoCapitalize='none'
          autoCorrect={false}
          onSubmitEditing={this.setMALUsername.bind(this)}
          returnKeyType='go'
          placeholder='MAL username'
          onChangeText={this.usernameChanged.bind(this)}
        />
        <Button
          style={{ margin: 5 }}
          onPress={this.setMALUsername.bind(this)}
          title='Use MAL user'
          color='#fcd382'
          disabled={!this.hasValidUsername()}
        />
        <Text style={{ margin: 5 }}>or</Text>
        <Button
          style={{ margin: 5, color: '#fcd382' }}
          onPress={this.setLocalUser.bind(this)}
          title='Add anime you liked'
          color='#fcd382'
        />
      </KeyboardAvoidingView>
    )
  }

  usernameChanged (username) {
    let actualUsername =
      username === undefined || username === '' ? null : username

    this.setState({
      currentUsername: actualUsername
    })
  }

  hasValidUsername () {
    return (
      this.state.currentUsername != null &&
      this.state.currentUsername.length >= 3
    )
  }

  setMALUsername () {
    analyticsLogEvent('mal_user')
    localState.setMalUsernameAndLoadRecommendations(this.state.currentUsername)
  }

  setLocalUser () {
    localState.setLocalUser()
  }
}

// XXX move to top level?
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff'
  }
})
