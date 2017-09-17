import React, { PureComponent } from 'react'
import {
  Button,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  Linking,
  Platform,
  Text,
  TouchableHighlight,
  View
} from 'react-native'
import { default as MaterialIcon } from 'react-native-vector-icons/MaterialIcons'
import StarRating from './components/StarRating'
import BestTouchable from './components/BestTouchable'
import DimensionsListener from './helpers/DimensionsListener'
import { analyticsLogEvent } from './helpers/Firebase'

const forScreenshot = false

// XXX: shared
var tagDescription = {
  'planned-and-franchise': 'Plan to watch & related',
  planned: 'Plan to watch',
  franchise: 'Related to watched anime',
  'planned-franchise': 'Related to planned anime',
  'same-franchise': 'Same franchise',
  null: ''
}

function malURL (item) {
  return `https://myanimelist.net/anime/${item.animedbId}`
}

class AnimeListItem extends PureComponent {
  static minItemWidth = 300

  onRatingChanged (item, rating) {
    Keyboard.dismiss()
    this.props.onRatingChanged(item, rating)
  }

  onRatingRemoved (item) {
    Keyboard.dismiss()
    this.props.onRatingRemoved(item)
  }

  goToSite () {
    let item = this.props.item

    Linking.openURL(malURL(item))
    analyticsLogEvent('mal_link', {
      item_id: item.animedbId,
      item_name: item.title
    })
  }

  render () {
    let view = this._render()

    return (
      <BestTouchable
        onPress={this.goToSite.bind(this)}
        background={BestTouchable.SelectableBackground()}
        underlayColor='#a9d6f5'
      >
        {view}
      </BestTouchable>
    )
  }

  _render () {
    let item = this.props.item
    let iconSize = 28

    return (
      <View
        style={{
          flexDirection: 'row',
          overflow: 'hidden',
          width: this.props.itemWidth,
          height: 120,
          padding: 5
        }}
      >
        <Image
          style={{
            width: 80,
            height: 114,
            resizeMode: 'contain'
          }}
          source={
            forScreenshot
              ? require('./img/cover-loading.png')
              : { uri: item.image, cache: 'default' }
          }
          defaultSource={require('./img/cover-loading.png')}
        />
        <View
          style={{
            flexDirection: 'column',
            width: this.props.itemWidth - this.props.imgWidth - 5,
            paddingLeft: 5
          }}
        >
          <Text numberOfLines={1}>{item.title}</Text>
          <Text numberOfLines={1}>{item.genres}</Text>
          {item.episodes > 0 && (
            <Text>
              {item.franchiseEpisodes
                ? `${item.episodes} eps (${item.franchiseEpisodes} in franchise)`
                : `${item.episodes} eps`}
            </Text>
          )}
          <Text>{item.season}</Text>
          {item.tags && <Text>{tagDescription[item.tags]}</Text>}
          <View
            style={{
              flexDirection: 'row',
              flex: 1,
              justifyContent: 'space-between'
            }}
          >
            {/* XXX hardcoded width/height */}
            {this.props.onRatingChanged && (
              <StarRating
                width={iconSize * 5}
                height={iconSize}
                rating={item.userRating || 0}
                onUpdateRating={this.onRatingChanged.bind(this, item)}
              />
            )}
            {/* XXX hardcoded width/height, color */}
            {this.props.onRatingRemoved && (
              <TouchableHighlight
                style={{ marginRight: 20 }}
                onPress={this.onRatingRemoved.bind(this, item)}
                underlayColor='#fce782'
              >
                <MaterialIcon name='delete' size={iconSize} color='#fcd382' />
              </TouchableHighlight>
            )}
          </View>
        </View>
      </View>
    )
  }
}

export default class AnimeList extends PureComponent {
  dimensionsChanged ({ window: { width } }) {
    this.setState({ windowWidth: width })
  }

  render () {
    let { width } = Dimensions.get('window')
    let numColumns = Math.floor(width / AnimeListItem.minItemWidth)
    let itemWidth = width / numColumns

    return (
      <View style={this.props.style}>
        <DimensionsListener onChange={this.dimensionsChanged.bind(this)} />
        <FlatList
          style={this.props.style}
          data={this.props.items}
          key={'animeList-' + numColumns}
          numColumns={numColumns}
          initialNumToRender={5}
          maxToRenderPerBatch={2}
          windowSize={3}
          keyboardShouldPersistTaps='handled'
          renderItem={({ item }) => (
            /* XXX hardcoded image width */
            <AnimeListItem
              imgWidth={80}
              itemWidth={itemWidth}
              item={item}
              onRatingChanged={this.props.onRatingChanged}
              onRatingRemoved={this.props.onRatingRemoved}
            />
          )}
          keyExtractor={(item, index) => item.animedbId}
        />
      </View>
    )
  }
}
