import React, { Component, PureComponent } from 'react';
import {
    KeyboardAvoidingView,
    TextInput,
    View,
} from 'react-native';
import {
    aquaAutocomplete,
    localAnimeList,
} from './Globals';
import AnimeList from './AnimeList';
import { analyticsLogEvent } from './Firebase'

class HideableView extends Component {
    constructor(props) {
        super(props);

        this.state = {
            children: null,
        };
    }

    render() {
        if (!this.state.children && !this.props.children)
            return null;

        return (
          <View style={this.props.style}>
            {this.state.children || this.props.children}
          </View>
        );
    }
}

export default class AnimeSearch extends PureComponent {
    constructor(props) {
        super(props);

        this.searchResultsCallback = this.searchResults.bind(this);
    }

    componentDidMount() {
        aquaAutocomplete.pubSub.subscribe(this.searchResultsCallback);
    }

    componentWillUnmount() {
        aquaAutocomplete.pubSub.unsubscribe(this.searchResultsCallback);
    }

    render() {
        return (
          <KeyboardAvoidingView
            behavior='padding'
            style={{ flex: this.props.style.flex,
                     flexDirection: 'column',
                     justifyContent: 'flex-end' }}>
            <HideableView
              style={{ flex: 1 }}
              ref='hideableView' >
            </HideableView>
            <TextInput
              ref='textInput'
              marginLeft={15}
              marginRight={15}
              placeholder='Search anime you liked'
              style={{ height: 40 } /* XXX hardcoded */}
              onChangeText={this.onTextChanged.bind(this)}
              />
          </KeyboardAvoidingView>
        );
    }

    onTextChanged(text) {
        if (text) {
            aquaAutocomplete.setTerm(text);
        } else {
            this.searchResults([]);
        }
    }

    searchResults(anime) {
        let results = anime.length === 0 ? null : anime;
        this.refs.hideableView.setState({
            children: [
              <AnimeList
                key='hideableViewChild'
                items={anime}
                style={{ flex: 1 }}
                onRatingChanged={this.updateRating.bind(this)}
                />,
            ],
        });
        this.props.onSearchResults(results);
    }

    updateRating(item, rating) {
        analyticsLogEvent('added_anime')
        localAnimeList.addRating(item, rating)
            .then(this.resetSearch.bind(this))
            .catch((e) => console.error(e));
    }

    resetSearch() {
        this.refs.textInput.clear();
        this.refs.hideableView.setState({
            children: null,
        });
        this.props.onSearchResults(null);
    }
}
