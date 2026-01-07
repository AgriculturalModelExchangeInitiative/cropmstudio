import { IChangeEvent } from '@rjsf/core';
import React from 'react';

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
  next?: (data: IDict) => Promise<IMenuItem>;
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
   * Receives the accumulated data from previous forms.
   */
  initFormData?: (data: IDict) => Promise<IDict>;
  /**
   * An async function returning an updated schema, ran when initializing the form.
   * Receives the accumulated data from previous forms.
   */
  initSchema?: (data: IDict) => Promise<IDict>;
  /**
   * An async returning an updated schema when form data changed.
   */
  onDataChanged?: (e: IChangeEvent) => Promise<IDict | null>;
}

/**
 * Defines a sequence of forms displayed as tabs.
 */
export interface IFormSequence {
  /**
   * Array of tab definitions.
   */
  tabs: ITabFormItem[];
  /**
   * The submit endpoint for the final submission.
   */
  submitEndpoint: string;
  /**
   * Optional function to build the sequence dynamically.
   * Used for conditional sequences (e.g., unit vs composition models).
   */
  sequenceBuilder?: () => Promise<IFormSequence>;
}

/**
 * A menu item can contain a form builder, a form sequence, or a display component.
 */
export interface IMenuItem {
  /**
   * Optional function that returns a single form to display.
   */
  formBuilder?: IFormBuild;
  /**
   * Optional function that returns a sequence of forms to display as tabs.
   */
  formSequence?: IFormSequence;
  /**
   * Optional React component to display directly (without a form).
   */
  displayComponent?: React.FC;
}

/**
 * A single tab definition for the tabbed form view.
 */
export interface ITabFormItem {
  /**
   * The tab label displayed in the tab bar.
   */
  label: string;
  /**
   * The form definition for this tab.
   */
  formBuild: IFormBuild;
  /**
   * Whether this tab is optional (affects validation).
   */
  optional?: boolean;
}
