import React, { PureComponent } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { TabViewAnimated, TabBar } from 'react-native-tab-view'
import {
  aquaRecommendations,
  localAnimeList,
  localState
} from './state/Globals'
import IconStrip from './components/IconStrip'
import StatusBarPadding from './components/StatusBarPadding'
import { analyticsSetCurrentScreen } from './helpers/Firebase'
import AnimeList from './AnimeList'
import AnimeSearch from './AnimeSearch'

let filterDefinition = [
  {
    key: 'planned',
    description: 'plan to watch',
    initialState: true
  },
  {
    key: 'franchise',
    description: 'related',
    initialState: false
  },
  {
    key: 'planned-franchise',
    description: 'related-is-planned',
    initialState: false
  }
]

let malRoutes = [
  { key: 'completed', title: 'Complete' },
  { key: 'airing', title: 'Airing' }
]

let localRoutes = malRoutes.concat([{ key: 'local', title: 'My list' }])

const REFRESH_BUTTON_INTERVAL = 2 * 3600

function filterRecommendationsArray (recommendations, tagVisibility) {
  let filteredRecommendations = []

  for (let index in recommendations) {
    if (tagVisibility[recommendations[index].tags])
      filteredRecommendations.push(recommendations[index])
  }

  return filteredRecommendations
}

function filterRecommendations (recommendations, tagVisibility) {
  if (recommendations === null) return null

  return {
    completed: filterRecommendationsArray(
      recommendations.completed,
      tagVisibility
    ),
    airing: filterRecommendationsArray(recommendations.airing, tagVisibility)
  }
}

function tagVisibilityFromFilters (filterState) {
  return {
    'planned-and-franchise': filterState[0] && filterState[1],
    planned: filterState[0],
    franchise: filterState[1],
    'planned-franchise': filterState[2],
    'same-franchise': filterState[1],
    null: true
  }
}

function filterLabel (index, filterState) {
  return `${filterState[index] ? 'Hide' : 'Show'} "${filterDefinition[index]
    .description}"`
}

export default class UserRecommendations extends PureComponent {
  constructor (props) {
    super(props)

    this.updateRecommendationsCallback = this.updateRecommendations.bind(this)
    this.recommendFromLocalListCallback = this.recommendFromLocalList.bind(this)
    this.pendingRefresh = {
      timerId: null,
      lastRefresh: 0,
      startPending: 0,
      userMode: null
    }
    this.state = {
      recommendations: null,
      filteredRecommendations: null,
      localAnimeList: localAnimeList.getAnimeList(),
      filterState: filterDefinition.map(e => e.initialState),
      tagVisibility: tagVisibilityFromFilters(
        filterDefinition.map(e => e.initialState)
      ),
      showSearchResults: false,
      tabState: {
        index: 0,
        routes: aquaRecommendations.isLocalUser() ? localRoutes : malRoutes
      }
    }
  }

  render () {
    if (this.state.showSearchResults) {
      analyticsSetCurrentScreen('search_results', 'UserRecommendations')
    } else if (this.state.filteredRecommendations) {
      let { index } = this.state.tabState
      if (index == 0) {
        analyticsSetCurrentScreen(
          'recommendations_complete',
          'UserRecommendations'
        )
      } else if (index == 1) {
        analyticsSetCurrentScreen(
          'recommendations_airing',
          'UserRecommendations'
        )
      } else if (index == 2) {
        analyticsSetCurrentScreen(
          'recommendations_user_list',
          'UserRecommendations'
        )
      }
    } else if (aquaRecommendations.isLocalUser()) {
      analyticsSetCurrentScreen('empty_search', 'UserRecommendations')
    }

    if (
      !this.state.filteredRecommendations &&
      !aquaRecommendations.isLocalUser()
    ) {
      return (
        <View style={styles.container}>
          <Text style={styles.loading}>Loading recommendations...</Text>
        </View>
      )
    } else {
      return (
        <IconStrip.MenuContext>
          <View style={{ flex: 1, flexDirection: 'column' }}>
            <StatusBarPadding backgroundColor='#a9d6f5' />
            {this.state.filteredRecommendations &&
              !this.state.showSearchResults && (
                <TabViewAnimated
                  style={{ flex: 1 }}
                  navigationState={this.state.tabState}
                  renderScene={this.renderScene.bind(this)}
                  renderHeader={props => (
                    <TabBar
                      {...props}
                      indicatorStyle={{ backgroundColor: '#484e98' }}
                      labelStyle={{ color: '#484e98' }}
                      style={{ backgroundColor: '#a9d6f5' }}
                    />
                  )}
                  onRequestChangeTab={this.setTab.bind(this)}
                />
              )}
            {!this.state.filteredRecommendations &&
              !this.state.showSearchResults &&
              aquaRecommendations.isLocalUser() && <View style={{ flex: 1 }} />}
            {aquaRecommendations.isLocalUser() && (
              <AnimeSearch
                style={{ flex: this.state.showSearchResults ? 1 : 0 }}
                onSearchResults={this.showSearchResults.bind(this)}
              />
            )}
            <IconStrip
              style={{ backgroundColor: '#a9d6f5' }}
              iconSettings={{
                iconSize: 40,
                color: '#484e98',
                underlayColor: '#d9f4fb'
              }}
              popupItemSettings={{
                underlayColor: '#a9d6f5',
                style: { fontSize: 20 }
              }}
            >
              <IconStrip.PushButton
                iconName='refresh'
                disabled={!this.hasRecentUpdate()}
                onPress={this.reloadRecommendations.bind(this)}
              />
              {!aquaRecommendations.isLocalUser() && this.renderFilterMenu()}
              <IconStrip.PopupButton iconName='account-circle'>
                <IconStrip.PopupItem onPress={this.changeUserMode.bind(this)}>
                  Change user
                </IconStrip.PopupItem>
              </IconStrip.PopupButton>
            </IconStrip>
          </View>
        </IconStrip.MenuContext>
      )
    }
  }

  renderFilterMenu () {
    return (
      <IconStrip.PopupButton iconName='filter-list'>
        <IconStrip.PopupItem onPress={this.toggleFilterState.bind(this, 0)}>
          {filterLabel(0, this.state.filterState)}
        </IconStrip.PopupItem>
        <IconStrip.PopupItem onPress={this.toggleFilterState.bind(this, 1)}>
          {filterLabel(1, this.state.filterState)}
        </IconStrip.PopupItem>
        <IconStrip.PopupItem onPress={this.toggleFilterState.bind(this, 2)}>
          {filterLabel(2, this.state.filterState)}
        </IconStrip.PopupItem>
      </IconStrip.PopupButton>
    )
  }

  renderScene (tabView) {
    switch (tabView.route.key) {
      case 'completed':
        return (
          <AnimeList
            style={styles.recommendationList}
            items={this.state.filteredRecommendations.completed}
            onRatingChanged={
              aquaRecommendations.isLocalUser()
                ? localAnimeList.addRating.bind(localAnimeList)
                : null
            }
          />
        )
      case 'airing':
        return (
          <AnimeList
            style={styles.recommendationList}
            items={this.state.filteredRecommendations.airing}
          />
        )
      case 'local':
        return (
          <AnimeList
            style={styles.recommendationList}
            items={this.state.localAnimeList}
            onRatingChanged={localAnimeList.addRating.bind(localAnimeList)}
            onRatingRemoved={localAnimeList.removeRating.bind(localAnimeList)}
          />
        )
    }
  }

  showSearchResults (result) {
    this.setState({
      showSearchResults: !!result
    })
  }

  toggleFilterState (index) {
    this.setState(previous => {
      let newFilters = previous.filterState.slice()
      newFilters[index] = !newFilters[index]
      let tagVisibility = tagVisibilityFromFilters(newFilters)
      return {
        filterState: newFilters,
        tagVisibiliity: tagVisibility,
        filteredRecommendations: filterRecommendations(
          previous.recommendations,
          tagVisibility
        )
      }
    })
  }

  changeUserMode () {
    localState.resetUserMode()
  }

  setTab (index) {
    this.setState(previous => {
      return {
        tabState: Object.assign({}, previous.tabState, { index: index })
      }
    })
  }

  componentDidMount () {
    aquaRecommendations.pubSub.recommendations.subscribe(
      this.updateRecommendationsCallback
    )
    localAnimeList.pubSub.animeList.subscribe(
      this.recommendFromLocalListCallback
    )
  }

  componentWillUnmount () {
    aquaRecommendations.pubSub.recommendations.unsubscribe(
      this.updateRecommendationsCallback
    )
    localAnimeList.pubSub.animeList.unsubscribe(
      this.recommendFromLocalListCallback
    )
  }

  reloadRecommendations () {
    let userMode = aquaRecommendations.getUserMode()

    localState
      .getCurrentAnimeList(userMode)
      .then(this.eventuallyRequestRecommendations.bind(this, userMode))
  }

  hasRecentUpdate () {
    let now = Date.now() / 1000
    return now - this.pendingRefresh.lastRefresh >= REFRESH_BUTTON_INTERVAL
  }

  updateRecommendations (recommendations, refreshTime, userMode) {
    this.pendingRefresh.lastRefresh = refreshTime
    this.setState(previous => {
      return {
        recommendations: recommendations,
        filteredRecommendations: filterRecommendations(
          recommendations,
          previous.tagVisibility
        )
      }
    })
    localState
      .setCachedRecommendations(
        recommendations,
        this.pendingRefresh.lastRefresh,
        userMode
      )
      .catch(error => {
        console.error(error)
      })
  }

  recommendFromLocalList (animeList) {
    let ratingList = animeList.map(item => [
      item.animedbId,
      item.userStatus,
      item.userRating
    ])

    this.eventuallyRequestRecommendations('local', ratingList)
    this.setState({
      localAnimeList: animeList
    })
  }

  eventuallyRequestRecommendations (requestUserMode, ratingList) {
    let { timerId, startPending, lastRefresh, userMode } = this.pendingRefresh

    // re-requesting updated recommendations and re-rendering
    // the recommendation list every time is wasteful, so here we
    // delay and batch requests (the logic is to wait for .5 seconds of
    // inactivity, or up to 1 second since the first interaction)
    const INACTIVITY = 1
    const FORCE = 2

    if (this.state.recommendations) {
      let now = Date.now() / 1000
      // just let the timer trigger the update
      if (
        startPending &&
        now - startPending > FORCE &&
        userMode === requestUserMode
      )
        return
      let timerCallback = function () {
        this.pendingRefresh.timerId = null
        this.pendingRefresh.startPending = 0
        let promise
        if (requestUserMode === 'local') {
          promise = aquaRecommendations.setLocalRatings(ratingList)
        } else {
          promise = aquaRecommendations.loadMalRecommendations(ratingList)
        }
        if (promise) {
          promise.catch(error => console.error(error))
        }
      }.bind(this)
      if (startPending) {
        clearTimeout(timerId)
        this.pendingRefresh.timerId = setTimeout(
          timerCallback,
          INACTIVITY * 1000
        )
      } else {
        this.pendingRefresh.startPending = now
        this.pendingRefresh.timerId = setTimeout(
          timerCallback,
          INACTIVITY * 1000
        )
      }
    } else {
      aquaRecommendations.setLocalRatings(ratingList)
    }
  }
}

// XXX move to top level?
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#d9f4fb'
  },
  loading: {
    fontSize: 25,
    textAlign: 'center',
    margin: 10,
    color: '#484e98'
  },
  recommendationList: {
    alignSelf: 'stretch'
  }
})
