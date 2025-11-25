import {
  Button,
  caretDownEmptyIcon,
  FormComponent,
  LabIcon
} from '@jupyterlab/ui-components';
import { IChangeEvent } from '@rjsf/core';
import validatorAjv8 from '@rjsf/validator-ajv8';
import React from 'react';

import { IDict, IFormBuild } from '../types';

/**
 * The base form properties.
 */
export interface IBaseFormProps extends IFormBuild {
  onSubmit: (data: IDict<any>) => void;
  onCancel: () => void;
  onNavigateBack: ((data: IDict<any>) => void) | null;
}

const WrappedFormComponent: React.FC<any> = props => {
  return <FormComponent {...props} validator={validatorAjv8} />;
};

/**
 * The base form using the schema.
 */
export function BaseForm(props: IBaseFormProps): JSX.Element {
  const { getFormData, onSubmit, uiSchema, updateSchema } = props;
  const [schema, setSchema] = React.useState<IDict>({ ...props.schema });
  const [formData, setFormData] = React.useState<IDict>({
    ...(props.sourceData ?? {})
  });
  const [isValid, setIsValid] = React.useState<boolean>(false);

  /**
   * Update the schema when related props are updated.
   */
  React.useEffect(() => {
    if (updateSchema) {
      updateSchema().then(data => {
        setSchema({ ...data });
      });
    } else {
      setSchema({ ...props.schema });
    }
  }, [updateSchema, props.schema]);

  /**
   * Update the form data and the valid state when the schema is updated.
   */
  React.useEffect(() => {
    if (getFormData) {
      getFormData().then(data => {
        const newData = { ...data, ...(props.sourceData ?? {}) };
        setFormData({ ...newData });
        setIsValid(validatorAjv8.isValid(schema, newData, schema));
      });
    } else {
      setFormData({ ...(props.sourceData ?? {}) });
      setIsValid(validatorAjv8.isValid(schema, props.sourceData ?? {}, schema));
    }
  }, [schema]);

  /**
   * Update the form data and the valid state when form has changed.
   */
  const handleChange = (e: IChangeEvent) => {
    setFormData({ ...e.formData });
    setIsValid(!e.errors || e.errors.length === 0);
  };

  return (
    <div className={'form-container'}>
      <WrappedFormComponent
        // This key is required to properly update the form when the schema is updated.
        // Should it be fixed ?
        key={JSON.stringify(schema)}
        schema={schema}
        uiSchema={uiSchema}
        formData={formData}
        onChange={handleChange}
        liveValidate
      />
      <div className={'form-buttons'}>
        {props.onNavigateBack !== null && (
          <Button onClick={() => props.onNavigateBack!(formData)}>
            <LabIcon.resolveReact
              icon={caretDownEmptyIcon}
              className={'navigate-back'}
            />
          </Button>
        )}
        <Button
          className={'jp-mod-styled jp-mod-reject'}
          onClick={props.onCancel}
        >
          Cancel
        </Button>
        <Button
          className={'jp-mod-styled jp-mod-accept'}
          onClick={() => onSubmit(formData)}
          disabled={!isValid}
        >
          {typeof props.submit === 'string' ? 'Create' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
