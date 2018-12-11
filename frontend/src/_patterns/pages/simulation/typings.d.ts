// Adopted from https://github.com/markmarkoh/datamaps/pull/409
declare interface IDataMapOptions {
  element: HTMLElement;
  scope?: string;
  geographyConfig?: IDataMapGeographyConfigOptions;
  bubblesConfig?: IDataMapBubblesConfigOptions;
  arcConfig?: IDataMapArcConfigOptions;
  setProjection?: (element: HTMLElement, options: IDataMapOptions) => IDataMapProjection;
  fills?: { defaultFill: string, [key: string]: string };
  // done?: (datamap: {
  //   svg: d3.Selection<any>,
  //   options: IDataMapOptions,
  //   path: d3.geo.Path;
  //   projection: d3.geo.Projection;
  // }) => void;
  responsive?: boolean;
  projection?: string;
  height?: null | number;
  width?: null | number;
  dataType?: 'json' | 'csv';
  dataUrl?: null | string;
  data?: any;
  filters?: any;
  aspectRatio?: number;
  projectionConfig?: { rotation: any[] };
}

declare interface IDataMapGeographyConfigOptions {
  dataUrl?: null | string;
  hideAntarctica?: boolean;
  hideHawaiiAndAlaska?: boolean;
  borderWidth?: number;
  borderOpacity?: number;
  borderColor?: string;
  popupTemplate?: (geography: IDataMapGeographyData, data: any) => string;
  popupOnHover?: boolean;
  highlightOnHover?: boolean;
  highlightFillColor?: string;
  highlightBorderColor?: string;
  highlightBorderWidth?: number;
  highlightBorderOpacity?: number;
}

declare interface IDataMapBubblesConfigOptions {
  borderWidth?: number;
  borderOpacity?: number;
  borderColor?: string;
  popupOnHover?: boolean;
  radius?: null | number;
  popupTemplate?: (geography: IDataMapGeographyData, data: IDataMapBubbleDatum) => string;
  fillOpacity?: number;
  animate?: boolean;
  highlightOnHover?: boolean;
  highlightFillColor?: string;
  highlightBorderColor?: string;
  highlightBorderWidth?: number;
  highlightBorderOpacity?: number;
  highlightFillOpacity?: number;
  exitDelay?: number;
  key?: any; // JSON.stringify
}

declare interface IDataMapArcConfigOptions {
  strokeColor?: string;
  strokeWidth?: number;
  arcSharpness?: number;
  animationSpeed?: number;
  popupOnHover?: boolean;
  popupTemplate?: (geography: IDataMapGeographyData, data: any) => string;
}

declare interface IDataMapGeographyData {
  properties: { name: string };
}

declare interface IDataMapProjection {
  // path: d3.geo.Path;
  // projection: d3.geo.Projection;
}

declare interface IDataMapBubbleDatum {
  latitude: number;
  longitude: number;
  radius: number;
  fillKey?: string;
  borderColor?: string;
  borderWidth?: number;
  borderOpacity?: number;
  fillOpacity?: number;
  [key: string]: any;
}

declare interface IDataMapLabelOptions {
  labelColor?: string;
  lineWidth?: number;
  fontSize?: number;
  fontFamily?: string;
  customLabelText: any;
}

declare interface IDataMapArcDatum {
  origin: string | {
    latitude: number, longitude: number,
  };
  destination: string | {
    latitude: number, longitude: number,
  };
  options?: {
    strokeWidth?: number;
    strokeColor?: string;
    greatArc?: boolean;
  };
}

declare class Datamap {
  constructor(options: IDataMapOptions);
  public legend(): void;
  public updateChoropleth(data: string | any | null, options?: { reset: boolean, data: any }): void;
  public bubbles(data: ReadonlyArray<IDataMapBubbleDatum>, opts?: IDataMapGeographyConfigOptions): void;
  public labels(options?: IDataMapLabelOptions): void;
  public resize(): void;
  public arc(data: ReadonlyArray<IDataMapArcDatum>, options?: IDataMapArcConfigOptions): void;
  public latLngToXY(lat: number, lng: number): any;
  public addLayer(className: string, id: string, first: boolean): SVGElement;
  public updatePopup(element: HTMLElement, d: IDataMapGeographyData, options: IDataMapGeographyConfigOptions): string;
  public addPlugin(name: string, pluginFn: () => void): void;
}

interface IJQuery {
  datamaps(options: IDataMapOptions): void;
}
