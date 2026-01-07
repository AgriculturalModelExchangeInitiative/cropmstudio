import { About } from './components';
import { createFormBuilder } from './form-builders';
import { IMenuItem } from './types';

import createPackageSchema from './_schema/create-package.json';
import displayModelSchema from './_schema/display-model.json';
import downloadPackageSchema from './_schema/download-package.json';
import editModelSchema from './_schema/edit-model.json';
import importPackageSchema from './_schema/import-package.json';

export const menuItems: { [title: string]: IMenuItem } = {
  [createPackageSchema.title]: {
    formBuilder: createFormBuilder('createPackage')
  },
  [importPackageSchema.title]: {
    formBuilder: createFormBuilder('importPackage')
  },
  'Create unit model': {
    formSequence: {
      tabs: [
        {
          label: 'Model Info',
          formBuild: createFormBuilder('createModel', { 'Model type': 'unit' })
        },
        {
          label: 'Inputs/Outputs',
          formBuild: createFormBuilder('createUnitModelInputOutputs')
        },
        {
          label: 'Parameters',
          formBuild: createFormBuilder('createUnitModelParamSets'),
          optional: true
        },
        {
          label: 'Test Sets',
          formBuild: createFormBuilder('createUnitModelTestSets'),
          optional: true
        }
      ],
      submitEndpoint: 'create-model'
    }
  },
  'Create composite model': {
    formSequence: {
      tabs: [
        {
          label: 'Model Info',
          formBuild: createFormBuilder('createModel', {
            'Model type': 'composition'
          })
        },
        {
          label: 'Composite Model',
          formBuild: createFormBuilder('createCompositeModel')
        }
      ],
      submitEndpoint: 'create-model'
    }
  },
  [editModelSchema.title]: {
    formBuilder: createFormBuilder('editModel')
  },
  'Crop2ML to platform': {
    formBuilder: createFormBuilder('crop2MLToPlatform')
  },
  'Platform to Crop2ML': {
    formBuilder: createFormBuilder('platformToCrop2ML')
  },
  [displayModelSchema.title]: {
    formBuilder: createFormBuilder('displayModel')
  },
  [downloadPackageSchema.title]: {
    formBuilder: createFormBuilder('downloadPackage')
  },
  About: {
    displayComponent: About
  }
};
