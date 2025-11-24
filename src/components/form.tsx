import { Button, FormComponent } from '@jupyterlab/ui-components';
import { IChangeEvent } from '@rjsf/core';
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
  const [isValid, setIsValid] = React.useState<boolean>(false);
  const [formData, setFormData] = React.useState<IDict>(props.sourceData ?? {});
  const formRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (formRef.current) {
      // Trigger validation on initial load
      const validationResult = formRef.current.validate(formData);
      if (validationResult && validationResult.errors?.length) {
        setIsValid(false);
      } else {
        setIsValid(true);
      }
    }
  }, []);

  const handleSubmit = () => {
    submit(formData);
  };

  const handleChange = (e: IChangeEvent) => {
    setFormData(e.formData);
    if (e.errors?.length) {
      setIsValid(false);
    } else {
      setIsValid(true);
    }
  };

  console.log('FORM DATA', formData);
  return (
    <div className={'form-container'}>
      <WrappedFormComponent
        ref={formRef}
        schema={schema}
        uiSchema={uiSchema}
        formData={formData}
        onChange={handleChange}
        liveValidate
      />
      <div className={'form-buttons'}>
        <Button
          className={'jp-mod-styled jp-mod-accept'}
          onClick={handleSubmit}
          disabled={!isValid}
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
