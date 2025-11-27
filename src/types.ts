import { IChangeEvent } from '@rjsf/core';

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
   * The submit endpoint.
   */
  submit: string | null;
  /**
   * The form schema.
   */
  schema: IDict;
  /**
   * Whether this form should be locked or not after submission.
   */
  lock?: boolean;
  /**
   * The next form, only if submit is null or empty.
   */
  nextForm?: (data: IDict) => Promise<IFormBuild>;
  /**
   * The UI schema.
   */
  uiSchema?: IDict;
  /**
   * The initial data.
   */
  sourceData?: IDict;
  /**
   * An async function returning the initial data.
   */
  initFormData?: () => Promise<IDict>;
  /**
   * An async function returning an updated schema, ran when initializing the form.
   */
  initSchema?: () => Promise<IDict>;
  /**
   * An async returning an updated schema when form data changed.
   */
  onDataChanged?: (e: IChangeEvent) => Promise<IDict | null>;
}
