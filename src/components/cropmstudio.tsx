import React from 'react';

import { Menu } from './menu';
import { BaseForm } from './form';
import { IFormInit, IDict } from '../types';

/**
 * The main component properties.
 */
export type CropmstudioProps = {
  /**
   * The function called when submitting a form.
   */
  submit: (endpoint: string, data: IDict<any>) => void;
};

/**
 * The main component including the menu and the form.
 */
export function Cropmstudio(props: CropmstudioProps): JSX.Element {
  const [endpoint, setEndpoint] = React.useState<string>();
  const [selected, setSelected] = React.useState<IFormInit>();

  const onMenuClick = (endpoint: string, initForm: IFormInit) => {
    setEndpoint(endpoint);
    setSelected(initForm);
  };

  const onFormSubmit = (data: IDict<any>) => {
    if (!endpoint) {
      console.error('No endpoint to submit the form.');
      return;
    }
    props.submit(endpoint, data);
    setEndpoint(undefined);
    setSelected(undefined);
  };

  const onFormCancel = () => {
    setEndpoint(undefined);
    setSelected(undefined);
  };

  return (
    <div className={'jp-cropmstudio-container'}>
      <div className={'menu-panel'}>
        <Menu onClick={onMenuClick} />
      </div>

      <div className={'form-panel'}>
        {selected ? (
          <BaseForm
            schema={selected.schema}
            uiSchema={selected.uiSchema}
            sourceData={selected.sourceData}
            submit={onFormSubmit}
            cancel={onFormCancel}
          />
        ) : (
          <div className={'form-placeholder'}>No form selected.</div>
        )}
      </div>
    </div>
  );
}
