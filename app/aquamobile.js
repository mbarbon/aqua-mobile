import React, { Component } from 'react'
import codePush from 'react-native-code-push'
import { Crashlytics } from 'react-native-fabric'
import { aquaRecommendations, localState } from './Globals'
import { analyticsSetCurrentScreen } from './Firebase'
import SplashScreen from './SplashScreen'
import UserMode from './UserMode'
import UserRecommendations from './UserRecommendations'

class aquamobile extends Component {
  constructor (props) {
    super(props)

    this.setUserModeCallback = this.setUserMode.bind(this)

    this.state = {
      userModeIsLoading: true,
      userModeIsSet: false
    }
  }

  render () {
    if (this.state.userModeIsLoading) {
      return <SplashScreen />
    } else if (this.state.userModeIsSet) {
      return <UserRecommendations />
    } else {
      analyticsSetCurrentScreen('initial_screen', 'UserMode')
      return <UserMode />
    }
  }

  componentDidMount () {
    aquaRecommendations.pubSub.userMode.subscribe(this.setUserModeCallback)
    localState
      .loadUserMode(24 * 3600)
      .then(userMode => {
        if (userMode == null) this.setUserMode()
      })
      .catch(error => {
        console.error(error)
        this.setUserMode()
      })
  }

  componentWillUnmount () {
    aquaRecommendations.pubSub.userMode.unsubscribe(this.setUserModeCallback)
  }

  setUserMode () {
    this.setState({
      userModeIsLoading: false,
      userModeIsSet: aquaRecommendations.hasUserMode()
    })
  }
}

codePush.getUpdateMetadata(codePush.UpdateState.RUNNING).then(update => {
  if (update && update.label) {
    Crashlytics.setString('CodePushRelease', 'codepush-' + update.label)
  } else {
    Crashlytics.setString('CodePushRelease', 'codepush-v0')
  }
})

export default (aquamobile = __DEV__ ? aquamobile : codePush(aquamobile))
