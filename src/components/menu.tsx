import { Button } from '@jupyterlab/ui-components';
import React from 'react';

import { menuItems } from '../menuItems';
import { IFormBuild } from '../types';

/**
 * The menu properties.
 */
export interface IMenuProps {
  /**
   * The function called when clicking a menu button.
   */
  onClick: (formBuild: IFormBuild) => void;
}

/**
 * The component including all the menu buttons.
 */
export function Menu(props: IMenuProps): JSX.Element {
  return (
    <div>
      <div className={'menu-container'}>
        {menuItems.map(item => (
          <Button
            className={'jp-mod-styled'}
            key={item.schema.$id}
            onClick={() => props.onClick(item)}
            title={item.label}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <div className={'menu-tooltip'}>
        <div>Select an action to display the form</div>
      </div>
    </div>
  );
}
