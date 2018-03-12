declare module '*.svg' {
  var svg: {
    viewBox: string,
    id: string,
    content: string,
  };

  export default svg;
}

declare module '*.css' {
  var css: any;
  export default css;
}
