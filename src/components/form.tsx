import { Button, FormComponent } from '@jupyterlab/ui-components';
import validatorAjv8 from '@rjsf/validator-ajv8';
import React from 'react';

import { IDict, IFormInit } from '../types';

/**
 * The base form properties.
 */
export interface IBaseFormProps extends IFormInit {
  submit: (data: IDict<any>) => void;
  cancel: () => void;
}

const WrappedFormComponent: React.FC<any> = props => {
  const { fields, ...rest } = props;
  return (
    <FormComponent
      {...rest}
      validator={validatorAjv8}
      fields={{
        ...fields
      }}
    />
  );
};

/**
 * The base form using the schema.
 */
export function BaseForm(props: IBaseFormProps): JSX.Element {
  const { schema, submit, uiSchema } = props;
  const [formData, setFormData] = React.useState<IDict>(props.sourceData ?? {});

  const handleSubmit = () => {
    submit(formData);
  };

  return (
    <div className={'form-container'}>
      <WrappedFormComponent
        schema={schema}
        uiSchema={uiSchema}
        formData={formData}
        onChange={(e: { formData: IDict }) => setFormData(e.formData)}
        liveValidate
      />
      <div className={'form-buttons'}>
        <Button
          className={'jp-mod-styled jp-mod-accept'}
          onClick={handleSubmit}
        >
          Create
        </Button>
        <Button
          className={'jp-mod-styled jp-mod-reject'}
          onClick={props.cancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
