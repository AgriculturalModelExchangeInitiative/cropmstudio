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
  submit: (endpoint: string, data: IDict<any>) => void;
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
        form => form.schema.title === current.schema.title
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
      form => form.schema.title === current.schema.title
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
  const onFormSubmit = (data: IDict<any>) => {
    if (!current) {
      console.error('There is no current form to submit.');
      return;
    }

    // Update the current form data in navigation.
    const currentIndex = navigation.current.findIndex(
      form => form.schema.title === current.schema.title
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
          form => (dataToSend[form.schema.title] = form.sourceData)
        );
      } else {
        // Send only the current data.
        dataToSend = data;
      }
      props.submit(current.submit, dataToSend);
      setCurrent(undefined);
      navigation.current = [];
    } else {
      // Get the next form from the submit value or function.
      let nextForm: IFormBuild;

      if (!current.nextForm) {
        console.error('There is no submit endpoint and no next form.');
        return;
      }

      if (typeof current.nextForm === 'function') {
        nextForm = current.nextForm(data);
      } else {
        nextForm = current.nextForm;
      }

      // Use the one from navigation if it exists.
      const nextIndex = navigation.current.findIndex(
        form => form.schema.title === nextForm.schema.title
      );

      if (nextIndex !== -1) {
        if (
          nextForm.schema.title === navigation.current[nextIndex].schema.title
        ) {
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
