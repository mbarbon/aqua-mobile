import React, { PureComponent } from 'react';
import {
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { default as MaterialIcon } from 'react-native-vector-icons/MaterialIcons';

function star(size, color, key) {
    return (
      <MaterialIcon
        key={Math.random()}
        name='grade'
        size={size}
        color={color}
        />
    );
}

class StarStrip extends PureComponent {
    render() {
        let stars = [];
        for (let i = 0; i < this.props.rating; ++i)
            stars.push(star(this.props.iconSize, this.props.color, 'star-' + i));

        return (
          <View
            style={{ flexDirection: this.props.direction,
                     flex: this.props.widthPercent }}
            >
            {stars}
          </View>
        );
    }
}

export default class StarRating extends PureComponent {
    constructor(props) {
        super(props);

        this.position = { x: 1000000, y: 0 };
        this.currentWidth = 0;
    }

    render() {
        let ratePercent = Math.round(this.props.rating * 100. / 5.);
        let mergedStyle = Object.assign(
            {flexDirection: 'row',
             width: this.props.width,
             height: this.props.height},
            this.props.style,
            this.size,
        );

        return (
          <TouchableWithoutFeedback
            onPress={this._checkAndUpdateRating.bind(this)}>
            <View
              ref='touchableChild'
              style={mergedStyle}
              >
              {/* XXX hardcoded color, max rating, integer rating */}
              <StarStrip
                color='#fcd382'
                direction='row'
                rating={this.props.rating}
                widthPercent={ratePercent}
                iconSize={this.props.height}
                />
              <StarStrip
                color='#808080'
                direction='row-reverse'
                rating={5 - this.props.rating}
                widthPercent={100 - ratePercent}
                iconSize={this.props.height}
                />
            </View>
          </TouchableWithoutFeedback>
        );
    }

    _setRating(rating) {
        if (rating < 0 || rating > 5) {
            console.warn("Invalid rating", rating);
            return;
        }

        if (this.props.onUpdateRating)
            this.props.onUpdateRating(rating);
    }

    // All those shenanigans are there because the position reported by
    // the touchable is relative to the touched inner view, not to the
    // touchable itself, and I don't want to wrap each icon in a touchable
    _checkAndUpdateRating(event) {
        let pageX = event.nativeEvent.pageX;
        let rx = pageX - this.position.x;
        if (rx < 0 || rx > this.currentWidth)
            this._updatePositionAndThen(this._updateRating.bind(this, pageX));
        else
            this._updateRating(pageX);
    }

    _updatePositionAndThen(callback) {
        this.refs.touchableChild.measure((x, y, w, h, px, py) => {
            this.currentWidth = w;
            this.position = { x: x + px, y: y + py };

            callback();
        });
    }

    _updateRating(pageX) {
        let rx = pageX - this.position.x;
        let rating = 5 * rx / this.currentWidth;
        let intRating = Math.round(rating + 0.4);

        this._setRating(intRating);
    }
}

StarRating.defaultProps = {
    rating: 0,
};
