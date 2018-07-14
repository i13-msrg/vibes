declare module '*.svg' {
  const svg: {
    viewBox: string,
    id: string,
    content: string,
  };

  export default svg;
}

declare module '*.css' {
  const css: any;
  export default css;
}
