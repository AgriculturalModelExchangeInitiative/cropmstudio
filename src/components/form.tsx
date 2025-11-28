import {
  Button,
  caretDownEmptyIcon,
  FormComponent,
  LabIcon
} from '@jupyterlab/ui-components';
import { JSONExt, ReadonlyJSONObject } from '@lumino/coreutils';
import { IChangeEvent } from '@rjsf/core';
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import { customizeValidator } from '@rjsf/validator-ajv8';
import React from 'react';

import { IDict, IFormBuild } from '../types';

/**
 * The base form properties.
 */
export interface IBaseFormProps extends IFormBuild {
  onSubmit: (data: IDict<any>) => void;
  onCancel: () => void;
  onNavigateBack: ((data: IDict<any>) => void) | null;
  accumulatedData?: IDict;
}

/**
 * The base form using the schema.
 */
export function BaseForm(props: IBaseFormProps): JSX.Element {
  const { initFormData, onDataChanged, onSubmit, uiSchema, initSchema } = props;
  const [schema, setSchema] = React.useState<IDict>(
    JSONExt.deepCopy(props.schema)
  );
  const [formData, setFormData] = React.useState<IDict>(
    JSONExt.deepCopy(props.sourceData ?? {})
  );

  // Create a fresh validator instance for each schema to avoid AJV caching issues
  const validator = React.useMemo(() => {
    return customizeValidator<ReadonlyJSONObject>();
  }, [schema.$id]);

  /**
   * Update the schema and init form data when schema property is updated.
   */
  React.useEffect(() => {
    const formDataInitialization = () => {
      if (initFormData) {
        initFormData(props.accumulatedData ?? {}).then(data => {
          const newData = {
            ...data,
            ...JSONExt.deepCopy(props.sourceData ?? {})
          };
          setFormData({ ...newData });
        });
      } else {
        setFormData(JSONExt.deepCopy(props.sourceData ?? {}));
      }
    };
    if (initSchema) {
      initSchema(props.accumulatedData ?? {}).then(data => {
        setSchema({ ...data });
        formDataInitialization();
      });
    } else {
      setSchema(JSONExt.deepCopy(props.schema));
      formDataInitialization();
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

  console.log('FORM DATA', formData);
  return (
    <div className={'form-container'}>
      <FormComponent
        // This key is required to properly update the form when the schema is updated.
        // Should it be fixed ?
        key={JSON.stringify(schema)}
        schema={schema}
        uiSchema={uiSchema as UiSchema<ReadonlyJSONObject, RJSFSchema, any>}
        formData={formData}
        onChange={handleChange}
        onSubmit={() => onSubmit(formData)}
        validator={validator}
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
      </FormComponent>
    </div>
  );
}
