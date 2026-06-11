import React from "react";
import { View } from "react-native";

import { SectionTitle, Body, Button } from "@/design-system";
import { captureError } from "@/lib/monitoring";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Root error boundary. Catches render-time exceptions anywhere in the tree
 * below it, reports them via captureError, and shows a recovery UI instead of
 * a white screen. The "Try again" button clears the error to re-mount children.
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    captureError(error, { componentStack: info.componentStack });
    if (__DEV__) {
      console.error("ErrorBoundary caught an error:", error, info);
    }
  }

  resetError = (): void => {
    this.setState({ error: null });
  };

  render(): React.ReactNode {
    const { error } = this.state;

    if (error) {
      return (
        <View className="flex-1 justify-center items-center bg-cream px-6">
          <SectionTitle className="text-purple-900 mb-2">
            Something went wrong
          </SectionTitle>
          <Body className="text-gray-500 mb-6 text-center">
            {error.message || "An unexpected error occurred."}
          </Body>
          <Button onPress={this.resetError}>Try again</Button>
        </View>
      );
    }

    return this.props.children;
  }
}
