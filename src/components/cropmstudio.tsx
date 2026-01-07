import React from 'react';

import { BaseForm } from './form';
import { Menu } from './menu';
import { TabbedFormView } from './tabbed-form-view';
import { menuItems } from '../menuItems';
import { IDict, IFormBuild, IFormSequence, IMenuItem } from '../types';

/**
 * The main component properties.
 */
export type CropmstudioProps = {
  /**
   * The function called when submitting a form.
   */
  submit: (endpoint: string, data: IDict<any>) => Promise<any>;
  /**
   * The landing page.
   */
  default?: string;
};

/**
 * The main component including the menu and the form.
 */
export function Cropmstudio(props: CropmstudioProps): JSX.Element {
  const [formTitle, setFormTitle] = React.useState<string>();
  const [current, setCurrent] = React.useState<IFormBuild>();
  const [currentSequence, setCurrentSequence] = React.useState<IFormSequence>();
  const [canGoBack, setCanGoBack] = React.useState<boolean>(false);
  const navigation = React.useRef<IFormBuild[]>([]);
  const [formCounter, setFormCounter] = React.useState<number>(0);
  const [Display, setDisplay] = React.useState<React.FC>();

  /**
   * Set the landing page on first load.
   */
  React.useEffect(() => {
    if (props.default && menuItems[props.default]) {
      onMenuClick(props.default, menuItems[props.default]);
    }
  }, []);

  /**
   * Submit the form and handle the response.
   *
   * @param endpoint - the endpoint of the post request.
   * @param data - the data to post.
   */
  const postData = async (endpoint: string, data: IDict) => {
    const response = await props.submit(endpoint, data);
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
        navigation.current = [];
        setFormTitle(undefined);
        setCurrentSequence(undefined);
        setCurrent(undefined);
        setCanGoBack(false);
        setDisplay(undefined);
      }
    }
  };

  /**
   * Check if it is possible to go back from this form.
   */
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
  const onMenuClick = async (title: string, item: IMenuItem) => {
    navigation.current = [];
    setCanGoBack(false);
    setFormTitle(title);

    if (item.formSequence) {
      // Display a tabbed form sequence
      const sequence = item.formSequence;
      setDisplay(undefined);
      setCurrent(undefined);
      setCurrentSequence(sequence);
      setFormCounter(prev => prev + 1); // Force remount
    } else if (item.formBuilder) {
      // Display a single form
      const formBuild = item.formBuilder;
      setDisplay(undefined);
      setCurrentSequence(undefined);
      setCurrent(formBuild);
      setFormCounter(prev => prev + 1); // Force remount of form
    } else if (item.displayComponent) {
      // Display a component directly
      setCurrent(undefined);
      setCurrentSequence(undefined);
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
      await postData(current.submit, dataToSend);
    } else {
      if (!current.next) {
        console.error('There is no submit endpoint and no next form/sequence.');
        return;
      }

      const mergedData: IDict = {};
      navigation.current.forEach(
        form => (mergedData[form.schema.$id] = form.sourceData)
      );

      const next = await current.next(mergedData);
      if (next.formBuilder) {
        let nextForm = next.formBuilder;

        // Use the one from navigation if it exists.
        const nextIndex = navigation.current.findIndex(
          form => form.schema.$id === nextForm.schema.$id
        );

        if (nextIndex !== -1) {
          if (
            nextForm.schema.$id === navigation.current[nextIndex].schema.$id
          ) {
            nextForm = navigation.current[nextIndex];
          } else {
            navigation.current[nextIndex] = nextForm;
          }
        }
        setCurrent({ ...nextForm });
        updateCanGoBack(nextForm);
      } else if (next.formSequence) {
        setCurrent(undefined);
        setCurrentSequence(next.formSequence);
      }
    }
  };

  const onFormCancel = () => {
    navigation.current = [];
    setCurrent(undefined);
    setCurrentSequence(undefined);

    // Restore the landing page.
    if (props.default && menuItems[props.default]) {
      onMenuClick(props.default, menuItems[props.default]);
    }
  };

  /**
   * Handle submission of a tabbed form sequence.
   */
  const onSequenceSubmit = async (allData: IDict<any>) => {
    if (!currentSequence) {
      console.error('There is no current sequence to submit.');
      return;
    }

    await postData(currentSequence.submitEndpoint, allData);
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
        {currentSequence ? (
          <>
            {formTitle && <h2>{formTitle}</h2>}
            <TabbedFormView
              key={`sequence-${formCounter}`}
              tabs={currentSequence.tabs}
              submitEndpoint={currentSequence.submitEndpoint}
              onSubmit={onSequenceSubmit}
              onCancel={onFormCancel}
              accumulatedData={accumulatedData}
            />
          </>
        ) : current ? (
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
