/**
 * A generic object type.
 */
export interface IDict<T = any> {
  [key: string]: T;
}

/**
 * The data required to build the form.
 */
export interface IFormBuild {
  /**
   * The submit endpoint or next form to build.
   */
  submit: string | IFormBuild;
  /**
   * The form schema.
   */
  schema: IDict;
  /**
   * The UI schema, optional.
   */
  uiSchema?: IDict;
  /**
   * The initial data, optional.
   */
  sourceData?: IDict;
  /**
   * An async function returning the initial data, optional.
   */
  getFormData?: () => Promise<IDict>;
  /**
   * An async function returning an updated schema, optional.
   */
  updateSchema?: () => Promise<IDict>;
}
