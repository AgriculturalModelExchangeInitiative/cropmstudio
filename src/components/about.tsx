import React from 'react';

/**
 * About component displaying information about Cropmstudio.
 */
export function About(): JSX.Element {
  return (
    <div className="about-container">
      <h2>About Cropmstudio</h2>
      <div className="about-content">
        <p>
          <strong>Cropmstudio</strong> is a JupyterLab extension for managing
          and transforming Crop2ML model packages.
        </p>

        <h3>Features</h3>
        <ul>
          <li>
            <strong>Package Management:</strong> Create, import, and download
            model packages
          </li>
          <li>
            <strong>Model Creation:</strong> Create unit and composite models
            with complete metadata
          </li>
          <li>
            <strong>Model Edition:</strong> Edit existing models with support
            for inputs, outputs, parameters, and test sets
          </li>
          <li>
            <strong>Transformation:</strong> Convert between Crop2ML format and
            platform-specific implementations
          </li>
          <li>
            <strong>Visualization:</strong> Display model workflows and
            compositions
          </li>
        </ul>

        <h3>Workflow</h3>
        <ol>
          <li>
            <strong>Create or Import a Package:</strong> Start by creating a new
            package or importing an existing one
          </li>
          <li>
            <strong>Create Models:</strong> Add unit models (basic algorithms)
            or composite models (combinations of units)
          </li>
          <li>
            <strong>Edit and Refine:</strong> Update model properties,
            parameters, and test cases
          </li>
          <li>
            <strong>Transform:</strong> Generate platform-specific code from
            Crop2ML models or import from existing implementations
          </li>
          <li>
            <strong>Export:</strong> Download packages for use in other
            environments
          </li>
        </ol>

        <h3>Technology</h3>
        <p>
          Cropmstudio is built on top of the{' '}
          <a
            href="https://github.com/AgriculturalModelExchangeInitiative/PyCrop2ML"
            target="_blank"
            rel="noopener noreferrer"
          >
            PyCrop2ML
          </a>{' '}
          library, which provides tools for model exchange and transformation in
          agricultural modeling.
        </p>

        <p className="about-footer">
          Select an action from the menu to get started.
        </p>
      </div>
    </div>
  );
}
