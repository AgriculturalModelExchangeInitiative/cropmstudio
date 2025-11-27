import React from 'react';

import { BaseForm } from './form';
import { Menu } from './menu';
import { IDict, IFormBuild } from '../types';

/**
 * The main component properties.
 */
export type CropmstudioProps = {
  /**
   * The function called when submitting a form.
   */
  submit: (endpoint: string, data: IDict<any>) => Promise<any>;
};

/**
 * The main component including the menu and the form.
 */
export function Cropmstudio(props: CropmstudioProps): JSX.Element {
  const [current, setCurrent] = React.useState<IFormBuild>();
  const [canGoBack, setCanGoBack] = React.useState<boolean>(false);
  const navigation = React.useRef<IFormBuild[]>([]);

  function updateCanGoBack(current: IFormBuild) {
    if (!navigation.current.length) {
      setCanGoBack(false);
    } else {
      const currentIndex = navigation.current.findIndex(
        form => form.schema.$id === current.schema.$id
      );
      setCanGoBack(currentIndex !== 0);
    }
  }

  /**
   * Update the current form on menu button click, and reset the navigation.
   */
  const onMenuClick = (formBuild: IFormBuild) => {
    navigation.current = [];
    setCurrent(formBuild);
    setCanGoBack(false);
  };

  /**
   * Navigating back to the previous form.
   */
  const onNavigateBack = (data: IDict<any>) => {
    if (!current) {
      console.error('There is no current form.');
      return;
    }
    if (!navigation?.current.length) {
      console.error('There is no form to navigate back.');
      return;
    }

    const currentIndex = navigation.current.findIndex(
      form => form.schema.$id === current.schema.$id
    );
    let previousForm: IFormBuild;
    if (currentIndex !== -1) {
      previousForm = navigation.current[currentIndex - 1];
      navigation.current[currentIndex] = { ...current, sourceData: data };
    } else {
      previousForm = navigation.current[navigation.current.length - 1];
      navigation.current.push({ ...current, sourceData: data });
    }

    setCurrent({ ...previousForm });
    updateCanGoBack(previousForm);
  };

  /**
   * Submitting the form.
   * If submit is a string, it calls the relevant endpoint, otherwise it opens the
   * relevant form.
   */
  const onFormSubmit = async (data: IDict<any>) => {
    if (!current) {
      console.error('There is no current form to submit.');
      return;
    }

    if (current.lock) {
      current.uiSchema = { ...current.uiSchema, 'ui:readonly': true };
    }

    // Update the current form data in navigation.
    const currentIndex = navigation.current.findIndex(
      form => form.schema.$id === current.schema.$id
    );
    if (currentIndex !== -1) {
      navigation.current[currentIndex] = { ...current, sourceData: data };
    } else {
      navigation.current.push({ ...current, sourceData: data });
    }

    if (current.submit) {
      // Submit is a string, call the endpoint.
      let dataToSend: IDict = {};
      if (navigation.current.length > 1) {
        // Send all the forms.
        navigation.current.forEach(
          form => (dataToSend[form.schema.$id] = form.sourceData)
        );
      } else {
        // Send only the current data.
        dataToSend = data;
      }
      const submission = await props.submit(current.submit, dataToSend);
      if (submission.success) {
        setCurrent(undefined);
        navigation.current = [];
        setCanGoBack(false);
      }
    } else {
      // Get the next form from the submit value or function.
      let nextForm: IFormBuild;

      if (!current.nextForm) {
        console.error('There is no submit endpoint and no next form.');
        return;
      }

      nextForm = await current.nextForm(data);

      // Use the one from navigation if it exists.
      const nextIndex = navigation.current.findIndex(
        form => form.schema.$id === nextForm.schema.$id
      );

      if (nextIndex !== -1) {
        if (nextForm.schema.$id === navigation.current[nextIndex].schema.$id) {
          nextForm = navigation.current[nextIndex];
        } else {
          navigation.current[nextIndex] = nextForm;
        }
      }
      setCurrent({ ...nextForm });
      updateCanGoBack(nextForm);
    }
  };

  const onFormCancel = () => {
    navigation.current = [];
    setCurrent(undefined);
  };

  return (
    <div className={'jp-cropmstudio-container'}>
      <div className={'menu-panel'}>
        <Menu onClick={onMenuClick} />
      </div>

      <div className={'form-panel'}>
        {current ? (
          <BaseForm
            {...current}
            onSubmit={onFormSubmit}
            onCancel={onFormCancel}
            onNavigateBack={canGoBack ? onNavigateBack : null}
          />
        ) : (
          <div className={'form-placeholder'}>No form selected.</div>
        )}
      </div>
    </div>
  );
}
