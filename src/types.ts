/**
 * A generic object type.
 */
export interface IDict<T = any> {
  [key: string]: T;
}

/**
 * The initial data of the form.
 */
export interface IFormInit {
  schema: IDict;
  sourceData?: IDict;
}
