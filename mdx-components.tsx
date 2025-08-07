import React from 'react'

type MDXComponents = {
  [key: string]: React.ComponentType<any>;
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
  }
}
