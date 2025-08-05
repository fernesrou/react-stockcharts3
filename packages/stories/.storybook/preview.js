import React from 'react';

// React 18 optimization decorator for charts
export const decorators = [
  (Story) => {
    return React.createElement('div', {
      'data-chart-container': true,
      style: {
        // CSS containment for better performance
        contain: 'layout style paint',
        // Isolation to prevent repaints
        isolation: 'isolate',
        // Force compositing layer for smooth rendering
        willChange: 'transform',
      },
    }, React.createElement(Story));
  }
];

export const parameters = {
    controls: { hideNoControlsWarning: true },
    options: {
        storySort: {
            order: ['Intro', 'Features', 'Visualization'],
        },
    },
};
