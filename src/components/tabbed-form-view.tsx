import { Button } from '@jupyterlab/ui-components';
import { JSONExt, ReadonlyJSONObject } from '@lumino/coreutils';
import { IChangeEvent } from '@rjsf/core';
import React from 'react';

import { IDict, ITabFormItem } from '../types';
import { BaseForm } from './form';
import { customizeValidator } from '@rjsf/validator-ajv8';

/**
 * Properties for the TabbedFormView component.
 */
export interface ITabbedFormViewProps {
  /**
   * Array of tab definitions.
   */
  tabs: ITabFormItem[];
  /**
   * Callback when all forms are submitted.
   */
  onSubmit: (allData: IDict<any>) => void;
  /**
   * Callback when the operation is cancelled.
   */
  onCancel: () => void;
  /**
   * The submit endpoint for the final submission.
   */
  submitEndpoint: string;
  /**
   * Accumulated data from previous forms (e.g., from edit model selection).
   */
  accumulatedData?: IDict;
}

/**
 * TabbedFormView displays multiple forms as tabs, allowing free navigation
 * between them and validating all forms only on final submission.
 */
export function TabbedFormView(props: ITabbedFormViewProps): JSX.Element {
  const { tabs, onSubmit, onCancel, accumulatedData = {} } = props;

  // Track active tab index
  const [activeTabIndex, setActiveTabIndex] = React.useState<number>(0);

  // Store form data for each tab (keyed by schema.$id)
  const [formsData, setFormsData] = React.useState<IDict<IDict>>(() => {
    const initialData: IDict<IDict> = {};
    tabs.forEach(tab => {
      const schemaId = tab.formBuild.schema.$id;
      initialData[schemaId] = JSONExt.deepCopy(tab.formBuild.sourceData ?? {});
    });
    return initialData;
  });

  // Track validation errors for each tab
  const [tabErrors, setTabErrors] = React.useState<IDict<boolean>>({});

  // Track which tabs have been visited (to show completion status)
  const [visitedTabs, setVisitedTabs] = React.useState<Set<number>>(
    new Set([0])
  );

  /**
   * Handle tab click to switch between forms.
   */
  const handleTabClick = (index: number) => {
    setActiveTabIndex(index);
    setVisitedTabs(prev => new Set(prev).add(index));
  };

  /**
   * Handle form data change for the active tab.
   */
  const handleFormChange = (schemaId: string, data: IDict) => {
    setFormsData(prev => ({
      ...prev,
      [schemaId]: data
    }));
  };

  /**
   * Validate a single form and return whether it's valid.
   */
  const validateForm = (tab: ITabFormItem): boolean => {
    // For now, we'll use a simple heuristic:
    // Check if required fields in the schema are present in the form data
    const schema = tab.formBuild.schema;
    const data = formsData[schema.$id];
    if (tab.optional) {
      return true; // Optional forms are always considered valid
    }

    const validator = customizeValidator<ReadonlyJSONObject>();
    return validator.isValid(schema, data, {});
  };

  /**
   * Handle final submission of all forms.
   */
  const handleSubmitAll = () => {
    // Validate all non-optional forms
    const errors: IDict<boolean> = {};
    let hasErrors = false;

    tabs.forEach((tab, index) => {
      const isValid = validateForm(tab);
      if (!isValid) {
        errors[tab.formBuild.schema.$id] = true;
        hasErrors = true;
      }
    });

    setTabErrors(errors);

    if (hasErrors) {
      // Find first tab with error and switch to it
      const firstErrorIndex = tabs.findIndex(
        tab => errors[tab.formBuild.schema.$id]
      );
      if (firstErrorIndex !== -1) {
        setActiveTabIndex(firstErrorIndex);
      }
      return;
    }

    // All forms are valid, collect all data
    const allData: IDict = { ...accumulatedData };
    tabs.forEach(tab => {
      const schemaId = tab.formBuild.schema.$id;
      allData[schemaId] = formsData[schemaId];
    });

    onSubmit(allData);
  };

  /**
   * Get the CSS class for a tab based on its state.
   */
  const getTabClass = (index: number): string => {
    const tab = tabs[index];
    const schemaId = tab.formBuild.schema.$id;
    const isActive = index === activeTabIndex;
    const hasError = tabErrors[schemaId] === true;
    const isVisited = visitedTabs.has(index);

    let className = 'jp-cropmstudio-tab';
    if (isActive) {
      className += ' jp-cropmstudio-tab-active';
    }
    if (hasError) {
      className += ' jp-cropmstudio-tab-error';
    }
    if (!isVisited) {
      className += ' jp-cropmstudio-tab-unvisited';
    }

    return className;
  };

  return (
    <div className="jp-cropmstudio-tabbed-form">
      {/* Tab bar */}
      <div className="jp-cropmstudio-tab-bar">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={getTabClass(index)}
            onClick={() => handleTabClick(index)}
          >
            {tab.label}
            {tab.optional && (
              <span className="jp-cropmstudio-tab-optional">(optional)</span>
            )}
            {tabErrors[tab.formBuild.schema.$id] && (
              <span className="jp-cropmstudio-tab-error-indicator">⚠</span>
            )}
          </button>
        ))}
      </div>

      {/* Active form content */}
      {tabs.map((tab, index) => {
        const schemaId = tab.formBuild.schema.$id;
        return (
          <div
            className="jp-cropmstudio-tab-content"
            key={schemaId}
            style={{ display: index === activeTabIndex ? 'unset' : 'none' }}
          >
            <TabFormContent
              tab={tab}
              formData={formsData[schemaId]}
              accumulatedData={{ ...accumulatedData, ...formsData }}
              onChange={handleFormChange}
              liveValidate={tabErrors[tab.formBuild.schema.$id]}
            />
          </div>
        );
      })}

      {/* Action buttons */}
      <div className="jp-cropmstudio-tabbed-form-buttons">
        <Button className="jp-mod-styled jp-mod-reject" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          className="jp-mod-styled jp-mod-accept"
          onClick={handleSubmitAll}
        >
          Submit All
        </Button>
      </div>
    </div>
  );
}

/**
 * Component to render a single form within a tab.
 */
interface ITabFormContentProps {
  tab: ITabFormItem;
  formData: IDict;
  accumulatedData: IDict;
  onChange: (schemaId: string, data: IDict) => void;
  liveValidate?: boolean;
}

function TabFormContent(props: ITabFormContentProps): JSX.Element {
  const { tab, formData, accumulatedData, onChange, liveValidate } = props;
  const { formBuild } = tab;

  const [schema, setSchema] = React.useState<IDict>(
    JSONExt.deepCopy(formBuild.schema)
  );
  const [currentFormData, setCurrentFormData] = React.useState<IDict>(
    JSONExt.deepCopy(formData)
  );

  /**
   * Initialize schema and form data when tab is mounted.
   */
  React.useEffect(() => {
    const initializeForm = async () => {
      let initializedSchema = JSONExt.deepCopy(formBuild.schema);
      let initializedData = JSONExt.deepCopy(formData);

      // Initialize schema if initSchema is provided
      if (formBuild.initSchema) {
        initializedSchema = await formBuild.initSchema(accumulatedData);
        setSchema(initializedSchema);
      }

      // Initialize form data if initFormData is provided
      if (formBuild.initFormData) {
        const loadedData = await formBuild.initFormData(accumulatedData);
        initializedData = {
          ...loadedData,
          ...initializedData
        };
        setCurrentFormData(initializedData);
        onChange(formBuild.schema.$id, initializedData);
      }
    };

    initializeForm();
  }, [formBuild.schema.$id]);

  /**
   * Handle form data changes.
   */
  const handleChange = async (e: IChangeEvent) => {
    const newData = { ...e.formData };
    setCurrentFormData(newData);
    onChange(formBuild.schema.$id, newData);
    return null;
  };

  // Render form content without submit button
  // We'll create a custom render to avoid the form's built-in submit button
  return (
    <div className="jp-cropmstudio-tab-form-wrapper">
      <BaseForm
        {...formBuild}
        schema={schema}
        sourceData={currentFormData}
        onDataChanged={handleChange}
        onSubmit={() => {}} // No-op, submission handled by parent
        onCancel={() => {}} // No-op, cancellation handled by parent
        onNavigateBack={null} // No back navigation in tabs
        accumulatedData={accumulatedData}
        hideButtons={true} // Hide form buttons, we have our own in parent
        liveValidate={liveValidate}
      />
    </div>
  );
}
