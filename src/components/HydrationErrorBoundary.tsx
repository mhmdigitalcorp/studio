'use client';
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class HydrationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if it's a hydration error
    if (error.message.includes('hydration') || error.message.includes('server-rendered HTML')) {
      return { hasError: true };
    }
    throw error;
  }

  componentDidCatch(error: Error) {
    if (error.message.includes('hydration') || error.message.includes('server-rendered HTML')) {
        console.error('Hydration error caught by boundary:', error);
    }
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.children;
    }

    return this.props.children;
  }
}

export default HydrationErrorBoundary;
