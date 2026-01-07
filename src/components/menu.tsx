import { Button } from '@jupyterlab/ui-components';
import React from 'react';

import { getMenuItemTitles } from '../menu-items';

/**
 * The menu properties.
 */
export interface IMenuProps {
  /**
   * The function called when clicking a menu button.
   */
  onClick: (title: string) => void;
}

/**
 * The component including all the menu buttons.
 */
export function Menu(props: IMenuProps): JSX.Element {
  return (
    <div>
      <div className={'menu-container'}>
        {getMenuItemTitles().map(title => (
          <Button
            className={'jp-mod-styled'}
            key={title}
            onClick={() => props.onClick(title)}
            title={title}
          >
            {title}
          </Button>
        ))}
      </div>

      <div className={'menu-tooltip'}>
        <div>Select an action to display the form</div>
      </div>
    </div>
  );
}
