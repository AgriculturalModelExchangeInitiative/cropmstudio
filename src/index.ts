import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { requestAPI } from './request';

/**
 * Initialization data for the cropmstudio extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'cropmstudio:plugin',
  description: 'A JupyterLab extension.',
  autoStart: true,
  optional: [ISettingRegistry],
  activate: (app: JupyterFrontEnd, settingRegistry: ISettingRegistry | null) => {
    console.log('JupyterLab extension cropmstudio is activated!');

    if (settingRegistry) {
      settingRegistry
        .load(plugin.id)
        .then(settings => {
          console.log('cropmstudio settings loaded:', settings.composite);
        })
        .catch(reason => {
          console.error('Failed to load settings for cropmstudio.', reason);
        });
    }

    requestAPI<any>('hello')
      .then(data => {
        console.log(data);
      })
      .catch(reason => {
        console.error(
          `The cropmstudio server extension appears to be missing.\n${reason}`
        );
      });
  }
};

export default plugin;
