// src/config/swagger.config.ts
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";
import YAML from "yaml";
import { Application } from "express"; // Changed from Express to Application

// Read the main Swagger YAML file
const mainSwaggerFilePath = path.resolve(
  __dirname,
  "../swagger/main-swagger.yaml"
);
const mainSwaggerFile = fs.readFileSync(mainSwaggerFilePath, "utf8");
const mainSwaggerDoc = YAML.parse(mainSwaggerFile);

// Get additional specs from the main swagger file
const additionalSpecs = mainSwaggerDoc["x-swagger-additional-specs"] || [];

// Function to merge all Swagger specs
const mergeSwaggerSpecs = () => {
  // Clone the main swagger doc
  const mergedSpec = { ...mainSwaggerDoc };

  // Remove the additional specs property
  delete mergedSpec["x-swagger-additional-specs"];

  // Initialize paths if not present
  if (!mergedSpec.paths) {
    mergedSpec.paths = {};
  }

  // Initialize components if not present
  if (!mergedSpec.components) {
    mergedSpec.components = {};
  }

  // Process each additional spec file
  additionalSpecs.forEach((specPath: string) => {
    const fullPath = path.resolve(__dirname, specPath);

    try {
      const specFile = fs.readFileSync(fullPath, "utf8");
      const specDoc = YAML.parse(specFile);

      // Merge paths
      if (specDoc.paths) {
        mergedSpec.paths = { ...mergedSpec.paths, ...specDoc.paths };
      }

      // Merge components
      if (specDoc.components) {
        Object.keys(specDoc.components).forEach((componentType) => {
          if (!mergedSpec.components[componentType]) {
            mergedSpec.components[componentType] = {};
          }

          mergedSpec.components[componentType] = {
            ...mergedSpec.components[componentType],
            ...specDoc.components[componentType],
          };
        });
      }

      // Merge tags (avoiding duplicates)
      if (specDoc.tags) {
        const existingTagNames = (mergedSpec.tags || []).map(
          (tag: any) => tag.name
        );
        const newTags = specDoc.tags.filter(
          (tag: any) => !existingTagNames.includes(tag.name)
        );

        if (newTags.length > 0) {
          mergedSpec.tags = [...(mergedSpec.tags || []), ...newTags];
        }
      }
    } catch (error) {
      console.error(`Error loading Swagger spec from ${fullPath}:`, error);
    }
  });

  return mergedSpec;
};

// Set up Swagger JSDoc
const swaggerOptions = {
  definition: mergeSwaggerSpecs(),
  apis: [], // We're using YAML files instead of JSDoc comments
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Function to set up Swagger UI
export const setupSwagger = (app: Application): void => {
  // Changed from Express to Application
  // Serve swagger docs
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Output swagger spec as JSON for autoAmated tools
  app.get("/swagger.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  console.log("Swagger documentation available at /api-docs");
};
