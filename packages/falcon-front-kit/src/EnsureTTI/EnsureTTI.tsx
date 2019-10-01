import React from 'react';
import PropTypes from 'prop-types';

type EnsureTTIState = {
  isReady: boolean;
  setTimeoutHandlerId?: any;
  requestIdleHandlerId?: any;
};

export type EnsureTTIRenderProps = {
  isReady: boolean;
  forceReady: () => void;
};
export type EnsureTTIProps = {
  /** Default timeout is `6000`ms and based on the assumption how the Lighthouse measures time to interactive to improve perceived performance
   * @see https://developers.google.com/web/updates/2018/05/first-input-delay
   */
  timeout?: number;
  children: (props: EnsureTTIRenderProps) => React.ReactNode;
};

/**
 * TTI measures the time from Navigation Start until the page's resources are loaded and the main thread is idle for at least 5 seconds
 */
export class EnsureTTI extends React.Component<EnsureTTIProps, EnsureTTIState> {
  static propTypes = {
    timeout: PropTypes.number,
    children: PropTypes.func.isRequired
  };

  static defaultProps = {
    timeout: 6000
  };

  constructor(props: EnsureTTIProps) {
    super(props);

    this.state = {
      isReady: false,
      setTimeoutHandlerId: undefined,
      requestIdleHandlerId: undefined
    };
  }

  componentDidMount() {
    const { timeout } = this.props;

    // set isReady flag after timeout
    const setTimeoutHandlerId = window.setTimeout(() => {
      if (this.state.isReady) {
        return;
      }

      if ('requestIdleCallback' in window) {
        const requestIdleHandlerId = window.requestIdleCallback(this.forceReady);

        return this.setState(x => ({ ...x, requestIdleHandlerId }));
      }

      return this.forceReady();
    }, timeout);

    // eslint-disable-next-line
    this.setState(x => ({ ...x, setTimeoutHandlerId }));
  }

  componentWillUnmount() {
    const { setTimeoutHandlerId, requestIdleHandlerId } = this.state;

    window.clearTimeout(setTimeoutHandlerId);
    if ('requestIdleCallback' in window && requestIdleHandlerId !== undefined) {
      window.cancelIdleCallback(requestIdleHandlerId);
    }
  }

  /** Sets isReady even before `timeout` */
  forceReady = () => {
    if (!this.state.isReady) {
      this.setState(x => ({ ...x, isReady: true }));
    }
  };

  render() {
    return this.props.children({
      isReady: this.state.isReady,
      forceReady: this.forceReady
    });
  }
}
