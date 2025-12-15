import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // 更新状态，下次渲染时显示降级UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // 可以将错误日志上报给服务器
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // 显示自定义的错误UI
      return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
          <h2>Something went wrong.</h2>
          <details style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px', overflow: 'auto' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }

    // 正常渲染子组件
    return this.props.children;
  }
}

export default ErrorBoundary;