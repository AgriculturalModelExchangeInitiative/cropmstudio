import { ReactWidget } from '@jupyterlab/apputils';
import React from 'react';

import { IDict } from '../types';
import { requestAPI } from '../request';
import { Cropmstudio } from '../components';

/**
 * Generic two-pane widget that can render multiple JSON-schema forms.
 * Left: list of forms (buttons). Right: selected form rendered via BaseForm().
 */
export class CropmstudioWidget extends ReactWidget {
  constructor() {
    super();
    this.addClass('jp-cropmstudio-widget');
    this.title.label = 'Cropmstudio';
    this.title.closable = true;
    this.id = 'cropmstudio-widget';
  }

  /**
   * Function calling the RestAPI when submitting the form.
   */
  private _submit = (endpoint: string, data: IDict<any>) => {
    requestAPI<any>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
      .then(data => {
        console.log('RECEIVED', endpoint, data);
      })
      .catch(reason => {
        console.error(
          `An error occurred while submitting the form.\n${reason}`
        );
      });
  };

  render(): JSX.Element {
    return <Cropmstudio submit={this._submit} />;
  }
}
