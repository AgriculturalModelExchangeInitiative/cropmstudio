import React from 'react';

import { BaseForm } from './form';
import { Menu } from './menu';
import { IDict, IFormBuild, IMenuItem } from '../types';

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
  const [formTitle, setFormTitle] = React.useState<string>();
  const [current, setCurrent] = React.useState<IFormBuild>();
  const [canGoBack, setCanGoBack] = React.useState<boolean>(false);
  const navigation = React.useRef<IFormBuild[]>([]);
  const [formCounter, setFormCounter] = React.useState<number>(0);
  const [Display, setDisplay] = React.useState<React.FC>();

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
   * Handle menu item click.
   */
  const onMenuClick = (title: string, item: IMenuItem) => {
    navigation.current = [];
    setCanGoBack(false);
    setFormTitle(title);

    if (item.formBuilder) {
      // Display a form
      const formBuild = item.formBuilder();
      setDisplay(undefined);
      setCurrent(formBuild);
      setFormCounter(prev => prev + 1); // Force remount of form
    } else if (item.displayComponent) {
      // Display a component directly
      setCurrent(undefined);
      setDisplay(() => item.displayComponent!);
    }
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
      const response = await props.submit(current.submit, dataToSend);
      if (response.success) {
        if (response.image) {
          // Display image
          setDisplay(() => () => <img src={response.image} />);
        } else if (response.download && response.filename) {
          // Handle file download
          const link = document.createElement('a');
          link.href = response.download;
          link.download = response.filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          // Default: reset the form
          setFormTitle(undefined);
          setCurrent(undefined);
          navigation.current = [];
          setCanGoBack(false);
          setDisplay(undefined);
        }
      }
    } else {
      // Get the next form from the submit value or function.
      let nextForm: IFormBuild;

      if (!current.nextForm) {
        console.error('There is no submit endpoint and no next form.');
        return;
      }

      const mergedData: IDict = {};
      navigation.current.forEach(
        form => (mergedData[form.schema.$id] = form.sourceData)
      );
      nextForm = await current.nextForm(mergedData);

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

  // Calculate accumulated data from all previous forms
  const accumulatedData = React.useMemo(() => {
    const merged: IDict = {};
    navigation.current.forEach(
      form => (merged[form.schema.$id] = form.sourceData)
    );
    return merged;
  }, [current]);

  return (
    <div className={'jp-cropmstudio-container'}>
      <div className={'menu-panel'}>
        <Menu onClick={onMenuClick} />
      </div>

      <div className={'main-panel'}>
        {current ? (
          <>
            {formTitle && <h2>{formTitle}</h2>}
            <BaseForm
              key={`${current.schema.$id}-${formCounter}`}
              {...current}
              onSubmit={onFormSubmit}
              onCancel={onFormCancel}
              onNavigateBack={canGoBack ? onNavigateBack : null}
              accumulatedData={accumulatedData}
            />
          </>
        ) : (
          !Display && (
            <div className={'form-placeholder'}>No form selected.</div>
          )
        )}
        {Display && <Display />}
      </div>
    </div>
  );
}
