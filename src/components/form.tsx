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
  const { getFormData, onDataChanged, onSubmit, uiSchema, initSchema } = props;
  const [schema, setSchema] = React.useState<IDict>({ ...props.schema });
  const [formData, setFormData] = React.useState<IDict>({
    ...(props.sourceData ?? {})
  });

  /**
   * Update the schema and init form data when schema property is updated.
   */
  React.useEffect(() => {
    const initFormData = (newSchema: IDict) => {
      if (getFormData) {
        getFormData().then(data => {
          const newData = { ...data, ...(props.sourceData ?? {}) };
          setFormData({ ...newData });
        });
      } else {
        setFormData({ ...(props.sourceData ?? {}) });
      }
    };
    if (initSchema) {
      initSchema().then(data => {
        setSchema({ ...data });
        initFormData({ ...data });
      });
    } else {
      setSchema({ ...props.schema });
      initFormData({ ...props.schema });
    }
  }, [initSchema, props.schema]);

  /**
   * Update the form data and optionally the schema when form has changed.
   */
  const handleChange = (e: IChangeEvent) => {
    setFormData({ ...e.formData });
    if (onDataChanged) {
      onDataChanged(e).then(newSchema => {
        if (newSchema) {
          setSchema({ ...newSchema });
        }
      });
    }
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
        onSubmit={() => onSubmit(formData)}
      >
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
          <Button className={'jp-mod-styled jp-mod-accept'} type={'submit'}>
            {props.submit === null ? 'Continue' : 'Create'}
          </Button>
        </div>
      </WrappedFormComponent>
    </div>
  );
}
