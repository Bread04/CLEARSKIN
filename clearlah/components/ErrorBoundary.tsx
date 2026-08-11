"use client";

import { Component, type ReactNode } from "react";
import Link from "next/link";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ClearLah] Uncaught error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen bg-neutral-50 flex items-center justify-center px-6">
          <div className="max-w-md text-center space-y-4">
            <div className="text-5xl">😿</div>
            <h1 className="text-h2 text-neutral-800">Something went wrong</h1>
            <p className="text-body-md text-neutral-600">
              An unexpected error occurred. Please try reloading the page.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="inline-block rounded-lg bg-primary-sage px-6 py-3 text-body-md font-semibold text-white min-h-[44px]"
            >
              Try again
            </button>
            <p className="text-body-sm text-neutral-500">
              If the problem persists,{" "}
              <Link href="/" className="underline text-primary-sage">
                go to the home page
              </Link>
              .
            </p>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
