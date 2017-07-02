import React, { PureComponent } from 'react';
import {
    Button,
    Dimensions,
    FlatList,
    Image,
    Linking,
    Platform,
    Text,
    TouchableHighlight,
    View,
} from 'react-native';
import { default as MaterialIcon } from 'react-native-vector-icons/MaterialIcons';
import StarRating from './StarRating';
import BestTouchable from './BestTouchable';

// XXX: shared
var tagDescription = {
    'planned-and-franchise': 'Plan to watch & related',
    'planned': 'Plan to watch',
    'franchise': 'Related to watched anime',
    'planned-franchise': 'Related to planned anime',
    'same-franchise': 'Same franchise',
    null: ''
};

function malURL(item) {
    return `https://myanimelist.net/anime/${item.animedbId}`;
}

class AnimeListItem extends PureComponent {
    constructor(props) {
        super(props);

        this.isUnmounted = false;
        this.state = {
            imgHeight: 0,
        };
    }

    componentDidMount() {
        Image.getSize(this.props.item.image, (width, height) => {
            if (this.isUnmounted)
                return;
            const ratio = width / height;

            this.setState({
                imgHeight: this.props.imgWidth / ratio
            });
        });
    }

    componentWillUnmount() {
        this.isUnmounted = true;
    }

    render() {
        let view = this._render();

        return (
          <BestTouchable
            onPress={() => Linking.openURL(malURL(this.props.item))}
            background={BestTouchable.SelectableBackground()}
            underlayColor='#a9d6f5'
            >
            {view}
          </BestTouchable>
        );
    }

    _render() {
        let {width, height} = Dimensions.get('window');
        let item = this.props.item;
        let iconSize = 28;

        return (
          <View style={{ flexDirection: 'row',
                         height: 120,
                         padding: 5 }}>
            <Image
              style={{ width: this.props.imgWidth,
                       height: this.state.imgHeight,
                       resizeMode: 'cover'}}
              source={{ uri: item.image }}
              defaultSource={require('./img/cover-loading.png')}
              />
            <View style={{flexDirection: 'column',
                        width: width - this.props.imgWidth - 5,
                        paddingLeft: 5}}>
              <Text numberOfLines={1}>{item.title}</Text>
              <Text numberOfLines={1}>{item.genres}</Text>
              {item.episodes > 0 &&
                   <Text>
                     {item.franchiseEpisodes ?
                          `${item.episodes} eps (${item.franchiseEpisodes} in franchise)` :
                          `${item.episodes} eps`}
                   </Text>
              }
              <Text>{item.season}</Text>
              {item.tags && <Text>{tagDescription[item.tags]}</Text>}
              <View
                style={{ flexDirection: 'row' }}
                >
              {/* XXX hardcoded width/height */}
              {this.props.onRatingChanged &&
                 <StarRating
                   width={iconSize * 5}
                   height={iconSize}
                   rating={item.userRating || 0}
                   onUpdateRating={this.props.onRatingChanged.bind(null, item)}
                   />}
              <View style={{ flex: 1 }} />
              {/* XXX hardcoded width/height, color */}
              {this.props.onRatingRemoved &&
                 <TouchableHighlight
                   style={{ marginRight: 20 }}
                   onPress={this.props.onRatingRemoved.bind(null, item)}
                   underlayColor='#fce782'
                   >
                   <MaterialIcon
                     name='delete'
                     size={iconSize}
                     color='#fcd382'
                     />
                 </TouchableHighlight>}
              </View>
            </View>
          </View>
        );
    }
}

export default class AnimeList extends PureComponent {
    render() {
        return (
          <FlatList
            style={this.props.style}
            data={this.props.items}
            initialNumToRender={5}
            maxToRenderPerBatch={2}
            windowSize={3}
            renderItem={({item}) =>
                /* XXX hardcoded image width */
                <AnimeListItem
                  imgWidth={80}
                  item={item}
                  onRatingChanged={this.props.onRatingChanged}
                  onRatingRemoved={this.props.onRatingRemoved}
                  />
            }
            keyExtractor={(item, index) => item.animedbId}
            />
        );
    }
}
