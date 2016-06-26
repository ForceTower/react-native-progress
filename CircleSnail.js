import React, {
  Component,
  PropTypes,
} from 'react';

import {
  Animated,
  ART,
  Easing,
} from 'react-native';

import Arc from './Shapes/Arc';

const AnimatedArc = Animated.createAnimatedComponent(Arc);

const MIN_ARC_ANGLE = 0.1;
const MAX_ARC_ANGLE = 1.5 * Math.PI;

export default class CircleSnail extends Component {
  static propTypes = {
    animating: PropTypes.bool,
    color: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string),
    ]),
    direction: PropTypes.oneOf(['clockwise', 'counter-clockwise']),
    hidesWhenStopped: PropTypes.bool,
    size: PropTypes.number,
    thickness: PropTypes.number,
  };

  static defaultProps = {
    animating: true,
    color: 'rgba(0, 122, 255, 1)',
    direction: 'counter-clockwise',
    hidesWhenStopped: false,
    size: 40,
    thickness: 3,
  };

  constructor(props) {
    super(props);

    this.state = {
      startAngle: new Animated.Value(-MIN_ARC_ANGLE),
      endAngle: new Animated.Value(0),
      rotation: new Animated.Value(0),
      colorIndex: 0,
    };
  }

  componentDidMount() {
    if (this.props.animating) {
      this.animate();
      this.spin();
    }
  }

  componentWillReceiveProps(props) {
    if (props.animating !== this.props.animating) {
      if (props.animating) {
        this.animate();
        this.spin();
      } else {
        this.stopAnimations();
      }
    }
  }

  animate(iteration = 1) {
    Animated.sequence([
      Animated.timing(this.state.startAngle, {
        toValue: -MAX_ARC_ANGLE * iteration - MIN_ARC_ANGLE,
        duration: 1000,
        isInteraction: false,
        easing: Easing.inOut(Easing.quad),
      }),
      Animated.timing(this.state.endAngle, {
        toValue: -MAX_ARC_ANGLE * iteration,
        duration: 1000,
        isInteraction: false,
        easing: Easing.inOut(Easing.quad),
      }),
    ]).start(endState => {
      if (endState.finished) {
        if (Array.isArray(this.props.color)) {
          this.setState({
            colorIndex: iteration % this.props.color.length,
          });
        }
        this.animate(iteration + 1);
      }
    });
  }

  spin() {
    Animated.timing(this.state.rotation, {
      toValue: 1,
      duration: 5000,
      easing: Easing.linear,
      isInteraction: false,
    }).start(endState => {
      if (endState.finished) {
        this.state.rotation.setValue(0);
        this.spin();
      }
    });
  }

  stopAnimations() {
    this.state.startAngle.stopAnimation();
    this.state.endAngle.stopAnimation();
    this.state.rotation.stopAnimation();
  }

  render() {
    const {
      animating,
      hidesWhenStopped,
      size,
      thickness,
      color,
      style,
      children,
      direction,
      ...restProps,
    } = this.props;

    if (!animating && hidesWhenStopped) {
      return null;
    }

    const radius = size / 2 - thickness;
    const offset = {
      top: thickness,
      left: thickness,
    };

    const directionFactor = direction === 'counter-clockwise' ? -1 : 1;

    return (
      <Animated.View {...restProps} style={[
        style,
        {
          backgroundColor: 'transparent',
          overflow: 'hidden',
          transform: [{
            rotate: this.state.rotation.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', directionFactor * 360 + 'deg'],
            }),
          }],
        },
      ]}>
        <ART.Surface
          width={size}
          height={size}>
          <AnimatedArc
            direction={direction === 'counter-clockwise' ? 'clockwise' : 'counter-clockwise'}
            radius={radius}
            stroke={Array.isArray(color) ? color[this.state.colorIndex] : color}
            offset={offset}
            startAngle={this.state.startAngle}
            endAngle={this.state.endAngle}
            strokeCap="round"
            strokeWidth={thickness} />
        </ART.Surface>
        {children}
      </Animated.View>
    );
  }
}
