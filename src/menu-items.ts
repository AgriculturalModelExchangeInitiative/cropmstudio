import { About } from './components';
import { createFormBuilder } from './form-builders';
import { IMenuItem, IMenuItemDefinition } from './types';

import createPackageSchema from './_schema/create-package.json';
import displayModelSchema from './_schema/display-model.json';
import downloadPackageSchema from './_schema/download-package.json';
import editModelSchema from './_schema/edit-model.json';
import importPackageSchema from './_schema/import-package.json';

/**
 * Static menu items configuration.
 * Contains only metadata, actual form builders are created on demand.
 */
const menuItemDefinitions: { [title: string]: IMenuItemDefinition } = {
  [createPackageSchema.title]: {
    type: 'form',
    formName: 'createPackage'
  },
  [importPackageSchema.title]: {
    type: 'form',
    formName: 'importPackage'
  },
  'Create unit model': {
    type: 'sequence',
    tabs: [
      {
        label: 'Model Info',
        formName: 'createModel',
        sourceData: { 'Model type': 'unit' }
      },
      {
        label: 'Inputs/Outputs',
        formName: 'createUnitModelInputOutputs'
      },
      {
        label: 'Parameters',
        formName: 'createUnitModelParamSets',
        optional: true
      },
      {
        label: 'Test Sets',
        formName: 'createUnitModelTestSets',
        optional: true
      }
    ],
    submitEndpoint: 'create-model'
  },
  'Create composite model': {
    type: 'sequence',
    tabs: [
      {
        label: 'Model Info',
        formName: 'createModel',
        sourceData: { 'Model type': 'composition' }
      },
      {
        label: 'Composite Model',
        formName: 'createCompositeModel'
      }
    ],
    submitEndpoint: 'create-model'
  },
  [editModelSchema.title]: {
    type: 'form',
    formName: 'editModel'
  },
  'Crop2ML to platform': {
    type: 'form',
    formName: 'crop2MLToPlatform'
  },
  'Platform to Crop2ML': {
    type: 'form',
    formName: 'platformToCrop2ML'
  },
  [displayModelSchema.title]: {
    type: 'form',
    formName: 'displayModel'
  },
  [downloadPackageSchema.title]: {
    type: 'form',
    formName: 'downloadPackage'
  },
  About: {
    type: 'component',
    component: About
  }
};

/**
 * Creates a fresh IMenuItem from a menu item definition.
 * This ensures that each menu click gets a new form instance.
 */
export function createMenuItem(title: string): IMenuItem | undefined {
  const definition = menuItemDefinitions[title];
  if (!definition) {
    return;
  }

  if (definition.type === 'form') {
    return {
      formBuilder: createFormBuilder(definition.formName, definition.sourceData)
    };
  } else if (definition.type === 'sequence') {
    return {
      formSequence: {
        tabs: definition.tabs.map(tab => ({
          label: tab.label,
          formBuilder: createFormBuilder(tab.formName, tab.sourceData),
          optional: tab.optional
        })),
        submitEndpoint: definition.submitEndpoint
      }
    };
  } else {
    return {
      displayComponent: definition.component
    };
  }
}

/**
 * A function returning the title of the menu item definitions.
 */
export function getMenuItemTitles(): string[] {
  return Object.keys(menuItemDefinitions);
}
