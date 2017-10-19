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

let statusFilterDefinition = [
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

let typeFilterDefinition = [
  {
    key: 1,
    description: 'TV',
    initialState: true
  },
  {
    key: 2,
    description: 'OVA',
    initialState: true
  },
  {
    key: 3,
    description: 'Movie',
    initialState: true
  },
  {
    key: 4,
    description: 'Special',
    initialState: true
  },
  {
    key: 5,
    description: 'ONA',
    initialState: true
  },
  {
    key: 6,
    description: 'Music',
    initialState: false
  }
]

let malRoutes = [
  { key: 'completed', title: 'Complete' },
  { key: 'airing', title: 'Airing' }
]

let localRoutes = malRoutes.concat([{ key: 'local', title: 'My list' }])

const REFRESH_BUTTON_INTERVAL = 2 * 3600

function filterRecommendationsArray (
  recommendations,
  tagVisibility,
  typeVisibility,
  localAnimeList
) {
  let filteredRecommendations = []
  let localAnimeSet = new Set((localAnimeList || []).map(a => a.animedbId))

  for (let index in recommendations) {
    let recommendation = recommendations[index]
    if (
      tagVisibility[recommendation.tags] &&
      (!recommendation.seriesType ||
        typeVisibility[recommendation.seriesType]) &&
      !localAnimeSet.has(recommendation.animedbId)
    ) {
      filteredRecommendations.push(recommendation)
    }
  }

  return filteredRecommendations
}

function filterRecommendations (
  recommendations,
  tagVisibility,
  typeVisibility,
  localAnimeList
) {
  if (recommendations === null) return null

  return {
    completed: filterRecommendationsArray(
      recommendations.completed,
      tagVisibility,
      typeVisibilityFromFilters(typeVisibility),
      localAnimeList
    ),
    airing: filterRecommendationsArray(
      recommendations.airing,
      tagVisibility,
      typeVisibilityFromFilters(typeVisibility),
      localAnimeList
    )
  }
}

function typeVisibilityFromFilters (typeFilterState) {
  let result = {}
  for (let i = 0; i < typeFilterDefinition.length; ++i) {
    result[typeFilterDefinition[i].key] = typeFilterState[i]
  }
  return result
}

function tagVisibilityFromFilters (statusFilterState) {
  return {
    'planned-and-franchise': statusFilterState[0] && statusFilterState[1],
    planned: statusFilterState[0],
    franchise: statusFilterState[1],
    'planned-franchise': statusFilterState[2],
    'same-franchise': statusFilterState[1],
    null: true
  }
}

function statusFilterLabel (index, statusFilterState) {
  return `${statusFilterState[index]
    ? 'Hide'
    : 'Show'} "${statusFilterDefinition[index].description}"`
}

function typeFilterLabel (index, typeFilterState) {
  return `${typeFilterState[index] ? 'Hide' : 'Show'} "${typeFilterDefinition[
    index
  ].description}"`
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
    let {
      typeFilterState,
      statusFilterState
    } = localState.getRecommendationFilterState()
    if (!statusFilterState) {
      statusFilterState = statusFilterDefinition.map(e => e.initialState)
    }
    if (!typeFilterState) {
      typeFilterState = typeFilterDefinition.map(e => e.initialState)
    }
    this.state = {
      recommendations: null,
      filteredRecommendations: null,
      localAnimeList: null,
      localAnimeListChanged: false,
      statusFilterState,
      typeFilterState,
      tagVisibility: tagVisibilityFromFilters(statusFilterState),
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
                disabled={this.hasRecentUpdate()}
                onPress={this.reloadRecommendations.bind(this)}
              />
              {this.renderFilterMenu()}
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

  renderTypeFilters () {
    return [0, 1, 2, 3, 4, 5].map(i => (
      <IconStrip.PopupItem
        key={'type.' + i}
        onPress={this.toggleTypeFilterState.bind(this, i)}
      >
        {typeFilterLabel(i, this.state.typeFilterState)}
      </IconStrip.PopupItem>
    ))
  }

  renderStatusFilters () {
    return [0, 1, 2].map(i => (
      <IconStrip.PopupItem
        key={'status.' + i}
        onPress={this.toggleStatusFilterState.bind(this, i)}
      >
        {statusFilterLabel(i, this.state.statusFilterState)}
      </IconStrip.PopupItem>
    ))
  }

  renderFilterMenu () {
    return (
      <IconStrip.PopupButton iconName='filter-list'>
        {this.renderTypeFilters()}
        {!aquaRecommendations.isLocalUser() && <IconStrip.Separator />}
        {!aquaRecommendations.isLocalUser() && this.renderStatusFilters()}
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

  updateStoredFilters () {
    localState.setRecommendationFilterState({
      statusFilterState: this.state.statusFilterState,
      typeFilterState: this.state.typeFilterState
    })
  }

  toggleStatusFilterState (index) {
    this.setState(previous => {
      let newFilters = previous.statusFilterState.slice()
      newFilters[index] = !newFilters[index]
      let tagVisibility = tagVisibilityFromFilters(newFilters)
      return {
        statusFilterState: newFilters,
        tagVisibiliity: tagVisibility,
        filteredRecommendations: filterRecommendations(
          previous.recommendations,
          tagVisibility,
          previous.typeFilterState,
          previous.localAnimeList
        )
      }
    }, this.updateStoredFilters.bind(this))
  }

  toggleTypeFilterState (index) {
    this.setState(previous => {
      let newFilters = previous.typeFilterState.slice()
      newFilters[index] = !newFilters[index]
      return {
        typeFilterState: newFilters,
        filteredRecommendations: filterRecommendations(
          previous.recommendations,
          previous.tagVisibility,
          newFilters,
          previous.localAnimeList
        )
      }
    }, this.updateStoredFilters.bind(this))
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
    this.recommendFromLocalList(this.state.localAnimeList, true)
  }

  hasRecentUpdate () {
    if (this.state.localAnimeListChanged) {
      return false
    }
    let now = Date.now() / 1000
    return now - this.pendingRefresh.lastRefresh < REFRESH_BUTTON_INTERVAL
  }

  updateRecommendations (recommendations, refreshTime, userMode) {
    this.pendingRefresh.lastRefresh = refreshTime
    this.setState(previous => {
      return {
        recommendations: recommendations,
        filteredRecommendations: filterRecommendations(
          recommendations,
          previous.tagVisibility,
          previous.typeFilterState,
          previous.localAnimeList
        ),
        localAnimeListChanged: false
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

  recommendFromLocalList (animeList, reloadRecommendations) {
    if (reloadRecommendations) {
      let ratingList = animeList.map(item => [
        item.animedbId,
        item.userStatus,
        item.userRating
      ])
      this.eventuallyRequestRecommendations('local', ratingList)
    }

    this.setState(previous => {
      return {
        filteredRecommendations: filterRecommendations(
          previous.recommendations,
          previous.tagVisibility,
          previous.typeFilterState,
          animeList
        ),
        localAnimeList: animeList,
        localAnimeListChanged: previous.localAnimeList != null
      }
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
