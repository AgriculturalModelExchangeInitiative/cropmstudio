import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ICommandPalette } from '@jupyterlab/apputils';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { requestAPI } from './request';

import { CropmstudioWidget } from './widgets/cropmstudio-widget';

const CommandIds = {
  open: 'cropmstudio:open'
};

/**
 * Initialization data for the cropmstudio extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'cropmstudio:plugin',
  description: 'A JupyterLab extension.',
  autoStart: true,
  optional: [ICommandPalette, ILayoutRestorer, ISettingRegistry],
  activate: (
    app: JupyterFrontEnd,
    palette: ICommandPalette | null,
    restorer: ILayoutRestorer | null,
    settingRegistry: ISettingRegistry | null
  ) => {
    const cropmstudioWidget = new CropmstudioWidget();

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
        console.log('hello', data);
      })
      .catch(reason => {
        console.error(
          `The cropmstudio server extension appears to be missing.\n${reason}`
        );
      });

    app.commands.addCommand(CommandIds.open, {
      label: 'Cropmstudio',
      caption: 'Open the Cropmstudio widget',
      execute: () => {
        // Check if the widget already exists in shell
        let widget = Array.from(app.shell.widgets('main')).find(
          w => w.id === 'cropmstudio-widget'
        );

        if (!widget && cropmstudioWidget) {
          // Use the pre-created widget
          widget = cropmstudioWidget;
          app.shell.add(widget, 'main');
        }

        if (widget) {
          app.shell.activateById(widget.id);
        }
      },
      describedBy: {
        args: {}
      }
    });

    if (palette) {
      palette.addItem({ category: 'cropmstudio', command: CommandIds.open });
    }

    if (restorer) {
      restorer.add(cropmstudioWidget, cropmstudioWidget.id);
    }

    console.log('JupyterLab extension cropmstudio is activated!');
  }
};

export default plugin;
